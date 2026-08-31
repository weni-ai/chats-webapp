/**
 * ElevenLabs TTS via WebSocket with Web Audio API playback.
 *
 * Uses single-use tokens (tts_websocket) so the ElevenLabs API key
 * never reaches the browser.  The player maintains a persistent
 * WebSocket connection for the voice session, sending text chunks
 * and receiving base64-encoded audio.
 *
 * Reconnection is automatic: callers provide a `getConnectionUrl`
 * callback that fetches a fresh token and returns a ready-to-use URL.
 */

import { VoiceError, VoiceErrorCode, getTTSErrorCode } from './errors';
import { mergeAudioChunks } from '@/utils/audioUtils';

const FADE_OUT_DURATION = 0.15;
const BARGE_IN_FADE_DURATION = 0.02;
const CONNECTION_TIMEOUT_MS = 10000;
const FIRST_CHUNK_TIMEOUT_MS = 10000;
const INTER_CHUNK_TIMEOUT_MS = 600;
const MAX_RECONNECT_ATTEMPTS = 2;

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

class TTSPlayer {
  /**
   * @param {object} [options]
   * @param {() => Promise<string>} [options.getConnectionUrl] Called when
   *   a (re)connection is needed.  Must return the full TTS WebSocket URL
   *   including a fresh single-use token.
   */
  constructor(options = {}) {
    this._getConnectionUrl = options.getConnectionUrl || null;
    this._ws = null;
    this._connected = false;

    this._audioContext = null;
    this._gainNode = null;
    this._currentSource = null;

    this._ttsQueue = [];
    this._isProcessingTTS = false;
    this._listeners = new Map();

    this._pendingAudioChunks = [];
    this._resolveAudioCollection = null;
    this._rejectAudioCollection = null;
    this._audioTimer = null;
    this._isCollecting = false;

    this.isPlaying = false;
    this.isStopped = false;
  }

  /**
   * Open a WebSocket to the ElevenLabs TTS streaming endpoint.
   * Sends the required init message ({ text: " " }) and waits for
   * the connection to be ready.
   *
   * @param {string} url  Full `wss://` URL with `single_use_token`
   * @returns {Promise<void>}
   */
  connect(url) {
    return new Promise((resolve, reject) => {
      if (this._connected && this._ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this._cleanup();

      let settled = false;
      let timeoutId = null;

      const settle = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        fn(value);
      };

      try {
        this._ws = new WebSocket(url);
      } catch (err) {
        reject(
          new VoiceError(
            VoiceErrorCode.TTS_CONNECTION_FAILED,
            `Failed to create TTS WebSocket: ${err.message}`,
            err,
          ),
        );
        return;
      }

      timeoutId = setTimeout(() => {
        settle(
          reject,
          new VoiceError(
            VoiceErrorCode.TTS_CONNECTION_FAILED,
            'TTS WebSocket connection timed out',
          ),
        );
        this._cleanup();
      }, CONNECTION_TIMEOUT_MS);

      this._ws.onopen = () => {
        try {
          this._ws.send(
            JSON.stringify({
              text: ' ',
              generation_config: { chunk_length_schedule: [50] },
            }),
          );
        } catch (err) {
          settle(
            reject,
            new VoiceError(
              VoiceErrorCode.TTS_CONNECTION_FAILED,
              'Failed to send TTS init message',
              err,
            ),
          );
          this._cleanup();
          return;
        }
        this._connected = true;
        settle(resolve, undefined);
      };

      this._ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.audio && this._isCollecting) {
          this._handleAudioChunk(msg.audio);
        }

        if (msg.isFinal) {
          this._flushCollectedAudio();
        }
      };

      this._ws.onerror = () => {
        const voiceError = new VoiceError(
          VoiceErrorCode.TTS_CONNECTION_FAILED,
          'TTS WebSocket error',
        );
        settle(reject, voiceError);
        this.emit('error', voiceError);
      };

      this._ws.onclose = (event) => {
        const wasConnected = this._connected;
        this._connected = false;

        const isAuthFailure = event.code === 1008;
        if (isAuthFailure && !settled) {
          settle(
            reject,
            new VoiceError(
              VoiceErrorCode.TTS_AUTH_FAILED,
              `TTS auth rejected (1008): ${event.reason || 'invalid token'}`,
            ),
          );
        } else if (!settled) {
          settle(
            reject,
            new VoiceError(
              VoiceErrorCode.TTS_CONNECTION_FAILED,
              `TTS WebSocket closed before ready: ${event.code}`,
            ),
          );
        }

        if (this._isCollecting) {
          this._rejectAudioCollection?.(
            new VoiceError(
              VoiceErrorCode.TTS_CONNECTION_FAILED,
              'TTS WebSocket closed during audio generation',
            ),
          );
          this._cancelAudioCollection();
        }

        if (wasConnected) {
          this.emit('disconnected', { code: event.code, reason: event.reason });
        }
      };
    });
  }

  /** Whether the TTS WebSocket is currently open. */
  isConnected() {
    return this._connected && this._ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Queue text for TTS synthesis and playback.
   * @param {string} text
   * @returns {Promise<void>}
   */
  speak(text) {
    return new Promise((resolve, reject) => {
      this.isStopped = false;
      this._ttsQueue.push({ text, resolve, reject });

      if (!this._isProcessingTTS) {
        this._processTTSQueue();
      }
    });
  }

  /**
   * Stop playback and clear the queue.
   * @param {boolean} [immediate=false]
   * @param {boolean} [bargeIn=false]
   */
  stop(immediate = false, bargeIn = false) {
    this.isStopped = true;
    this.isPlaying = false;
    this._isProcessingTTS = false;

    this._rejectPendingQueue('Playback stopped');
    this._ttsQueue = [];

    this._cancelAudioCollection();

    if (bargeIn) {
      this._fadeAndStop(BARGE_IN_FADE_DURATION);
    } else if (immediate) {
      this._stopSource();
      this._resetGain();
    } else {
      this._fadeAndStop(FADE_OUT_DURATION);
    }
  }

  /** Close the TTS WebSocket gracefully. */
  disconnect() {
    this._connected = false;
    this._cancelAudioCollection();
    if (this._ws) {
      try {
        this._ws.send(JSON.stringify({ text: '' }));
      } catch {
        /* closing */
      }
      try {
        this._ws.close(1000, 'Client disconnect');
      } catch {
        /* already closed */
      }
      this._ws = null;
    }
  }

  /** Stop playback, close connection, close AudioContext, remove listeners. */
  destroy() {
    this.stop(true);
    this.disconnect();
    this.removeAllListeners();

    if (this._audioContext) {
      try {
        this._audioContext.close();
      } catch {
        /* already closed */
      }
      this._audioContext = null;
      this._gainNode = null;
    }
  }

  // -- Event emitter -----------------------------------------------------------

  on(event, listener) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(listener);
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener(...args);
    };
    return this.on(event, wrapper);
  }

  off(event, listener) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
    return this;
  }

  emit(event, ...args) {
    const listeners = this._listeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch {
        /* listener errors must not break playback */
      }
    }
  }

  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }

  // -- Private: queue ----------------------------------------------------------

  /** @private */
  async _processTTSQueue() {
    this._isProcessingTTS = true;

    while (this._ttsQueue.length > 0 && !this.isStopped) {
      const { text, resolve, reject } = this._ttsQueue.shift();
      try {
        await this._speakImmediate(text);
        resolve();
      } catch (err) {
        reject(err);
      }
    }

    this._isProcessingTTS = false;
    if (!this.isStopped) {
      this.emit('queue:drained');
    }
  }

  // -- Private: speak ----------------------------------------------------------

  /** @private */
  async _speakImmediate(text) {
    await this._ensureConnected();

    this._initAudioContext();
    this.isPlaying = true;
    this.emit('started', { text });

    try {
      this._ws.send(JSON.stringify({ text: text + ' ', flush: true }));
      const base64Chunks = await this._collectAudioChunks();

      if (this.isStopped || base64Chunks.length === 0) {
        this.isPlaying = false;
        return;
      }

      const arrayBuffers = base64Chunks.map(base64ToArrayBuffer);
      const merged = mergeAudioChunks(arrayBuffers);
      const audioBuffer = await this._audioContext.decodeAudioData(merged);

      if (this.isStopped) {
        this.isPlaying = false;
        return;
      }

      await this._playBuffer(audioBuffer);
    } catch (err) {
      if (this.isStopped) {
        this.isPlaying = false;
        return;
      }
      this.isPlaying = false;
      const errorCode = getTTSErrorCode(err);
      throw err instanceof VoiceError
        ? err
        : new VoiceError(errorCode, err.message, err);
    } finally {
      this.isPlaying = false;
    }

    this.emit('ended');
  }

  /**
   * Ensure the WebSocket is open, reconnecting transparently if needed.
   * @private
   */
  async _ensureConnected() {
    if (this.isConnected()) return;

    if (!this._getConnectionUrl) {
      throw new VoiceError(
        VoiceErrorCode.TTS_CONNECTION_FAILED,
        'TTS WebSocket not connected and no getConnectionUrl provided',
      );
    }

    let lastError;
    for (let attempt = 0; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
      try {
        const url = await this._getConnectionUrl();
        await this.connect(url);
        return;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RECONNECT_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError instanceof VoiceError
      ? lastError
      : new VoiceError(
          VoiceErrorCode.TTS_CONNECTION_FAILED,
          'Failed to reconnect TTS WebSocket after retries',
          lastError,
        );
  }

  // -- Private: audio chunk collection -----------------------------------------

  /**
   * Wait for all audio chunks from the current generation.
   * Resolves with an array of base64 strings once a timeout
   * indicates no more chunks are coming.
   * @private
   * @returns {Promise<string[]>}
   */
  _collectAudioChunks() {
    return new Promise((resolve, reject) => {
      this._pendingAudioChunks = [];
      this._resolveAudioCollection = resolve;
      this._rejectAudioCollection = reject;
      this._isCollecting = true;
      this._startAudioTimer(FIRST_CHUNK_TIMEOUT_MS);
    });
  }

  /** @private */
  _handleAudioChunk(base64Audio) {
    this._pendingAudioChunks.push(base64Audio);
    this._startAudioTimer(INTER_CHUNK_TIMEOUT_MS);
  }

  /** @private */
  _startAudioTimer(ms) {
    clearTimeout(this._audioTimer);
    this._audioTimer = setTimeout(() => this._flushCollectedAudio(), ms);
  }

  /** @private */
  _flushCollectedAudio() {
    clearTimeout(this._audioTimer);
    this._audioTimer = null;

    if (this._resolveAudioCollection) {
      const chunks = [...this._pendingAudioChunks];
      this._pendingAudioChunks = [];
      const resolve = this._resolveAudioCollection;
      this._resolveAudioCollection = null;
      this._rejectAudioCollection = null;
      this._isCollecting = false;
      resolve(chunks);
    }
  }

  /** @private Discard any in-flight collection without resolving. */
  _cancelAudioCollection() {
    clearTimeout(this._audioTimer);
    this._audioTimer = null;
    this._pendingAudioChunks = [];
    this._resolveAudioCollection = null;
    this._rejectAudioCollection = null;
    this._isCollecting = false;
  }

  // -- Private: audio playback -------------------------------------------------

  /** @private */
  _playBuffer(audioBuffer) {
    return new Promise((resolve, reject) => {
      if (this.isStopped || !this._audioContext) {
        resolve();
        return;
      }

      const source = this._audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this._gainNode);
      this._currentSource = source;

      source.onended = () => {
        this._currentSource = null;
        resolve();
      };

      try {
        source.start(0);
      } catch (err) {
        this._currentSource = null;
        reject(err);
      }
    });
  }

  /** @private */
  _initAudioContext() {
    if (this._audioContext) return;

    this._audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this._gainNode = this._audioContext.createGain();
    this._gainNode.connect(this._audioContext.destination);
  }

  /** @private */
  _fadeAndStop(duration) {
    if (!this._gainNode || !this._audioContext) {
      this._stopSource();
      return;
    }

    const now = this._audioContext.currentTime;
    this._gainNode.gain.setValueAtTime(this._gainNode.gain.value, now);
    this._gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    setTimeout(() => {
      this._stopSource();
      this._resetGain();
    }, duration * 1000);
  }

  /** @private */
  _stopSource() {
    if (this._currentSource) {
      try {
        this._currentSource.stop();
      } catch {
        /* already stopped */
      }
      this._currentSource = null;
    }
  }

  /** @private */
  _resetGain() {
    if (this._gainNode && this._audioContext) {
      this._gainNode.gain.cancelScheduledValues(this._audioContext.currentTime);
      this._gainNode.gain.setValueAtTime(1, this._audioContext.currentTime);
    }
  }

  /** @private */
  _rejectPendingQueue(reason) {
    for (const entry of this._ttsQueue) {
      try {
        entry.reject(
          new VoiceError(VoiceErrorCode.TTS_GENERATION_FAILED, reason),
        );
      } catch {
        /* ignore */
      }
    }
  }

  // -- Private: WebSocket cleanup ----------------------------------------------

  /** @private */
  _cleanup() {
    if (this._ws) {
      this._ws.onopen = null;
      this._ws.onmessage = null;
      this._ws.onerror = null;
      this._ws.onclose = null;
      try {
        this._ws.close();
      } catch {
        /* ignore */
      }
      this._ws = null;
    }
    this._connected = false;
    this._cancelAudioCollection();
  }
}

export { TTSPlayer };
export default TTSPlayer;
