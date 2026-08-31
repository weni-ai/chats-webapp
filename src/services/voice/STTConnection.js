/**
 * WebSocket connection to ElevenLabs Scribe v2 Realtime STT.
 * Manage lifecycle, send audio chunks, and emit transcription events.
 */

import { buildSTTWebSocketURL } from './config';
import {
  VoiceError,
  VoiceErrorCode,
  getWebSocketErrorCode,
  getSTTMessageErrorCode,
} from './errors';

const CONNECTION_TIMEOUT_MS = 10000;

class STTConnection {
  /**
   * Create an STT WebSocket connection manager.
   * @param {object} config - Voice configuration object
   * @param {string} token - ElevenLabs auth token
   */
  constructor(config, token) {
    this._config = config;
    this._token = token;
    this._ws = null;
    this._connected = false;
    this._listeners = new Map();

    const emitSTTError = (msg) => {
      const errorCode = getSTTMessageErrorCode(msg.message_type);
      this.emit('error', new VoiceError(errorCode, msg.error));
    };

    this._messageHandlers = {
      session_started: (msg) =>
        this.emit('session', { sessionId: msg.session_id, config: msg }),
      partial_transcript: (msg) =>
        this.emit('partial', { text: msg.text || '' }),
      committed_transcript: (msg) =>
        this.emit('committed', { text: msg.text || '' }),
      committed_transcript_with_timestamps: (msg) =>
        this.emit('committed', {
          text: msg.text || '',
          languageCode: msg.language_code,
          words: msg.words,
        }),
      insufficient_audio_activity: () => {},
      error: emitSTTError,
      auth_error: emitSTTError,
      rate_limited: emitSTTError,
      quota_exceeded: emitSTTError,
      commit_throttled: emitSTTError,
      input_error: emitSTTError,
      chunk_size_exceeded: emitSTTError,
      transcriber_error: emitSTTError,
      queue_overflow: emitSTTError,
      resource_exhausted: emitSTTError,
      session_time_limit_exceeded: emitSTTError,
      unaccepted_terms: emitSTTError,
    };
  }

  /**
   * Open the WebSocket and wait for session_started.
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this._connected) {
        resolve();
        return;
      }

      const url = buildSTTWebSocketURL(this._config, this._token);

      let timeoutId = null;
      let settled = false;

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
            getWebSocketErrorCode(err),
            `Failed to create WebSocket: ${err.message}`,
            err,
          ),
        );
        return;
      }

      timeoutId = setTimeout(() => {
        settle(
          reject,
          new VoiceError(
            VoiceErrorCode.STT_CONNECTION_FAILED,
            'STT connection timed out',
          ),
        );
        this._cleanup();
      }, CONNECTION_TIMEOUT_MS);

      this._ws.onopen = () => {};

      this._ws.onmessage = (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!settled && message.message_type === 'session_started') {
          this._connected = true;
          this._handleMessage(message);
          settle(resolve, undefined);
          return;
        }

        if (!settled && this._isErrorType(message.message_type)) {
          const errorCode = getSTTMessageErrorCode(message.message_type);
          settle(reject, new VoiceError(errorCode, message.error));
          this._cleanup();
          return;
        }

        this._handleMessage(message);
      };

      this._ws.onerror = (event) => {
        const err = event.error || new Error('WebSocket error');
        const errorCode = getWebSocketErrorCode(err);
        const voiceError = new VoiceError(errorCode, err.message, err);
        settle(reject, voiceError);
        this.emit('error', voiceError);
      };

      this._ws.onclose = (event) => {
        this._connected = false;

        // 1008 = Policy Violation: ElevenLabs rejected authentication.
        // This means the token is invalid, expired, or the account does not
        // have Scribe v2 Realtime access. Surface a clear, actionable message.
        const isAuthFailure = event.code === 1008;
        const errorCode = isAuthFailure
          ? VoiceErrorCode.STT_AUTH_FAILED
          : VoiceErrorCode.STT_CONNECTION_FAILED;
        const reasonDetail = event.reason ? ` — "${event.reason}"` : '';
        const message = isAuthFailure
          ? `ElevenLabs rejected authentication (1008)${reasonDetail}. Check API key and plan permissions (Scribe v2 Realtime required).`
          : `WebSocket closed before session started: ${event.code}${reasonDetail}`;

        settle(reject, new VoiceError(errorCode, message));
        this.emit('close', { code: event.code, reason: event.reason });
      };
    });
  }

  /**
   * Send a base64-encoded audio chunk to the STT service.
   * @param {string} audioBase64 - Base64-encoded PCM audio
   * @param {number} sampleRate - Audio sample rate in Hz
   * @param {boolean} [commit=false] - Force commit after this chunk
   */
  sendAudio(audioBase64, sampleRate, commit = false) {
    if (!this._connected || !this._ws) {
      return;
    }

    this._ws.send(
      JSON.stringify({
        message_type: 'input_audio_chunk',
        audio_base_64: audioBase64,
        commit,
        sample_rate: sampleRate,
      }),
    );
  }

  /**
   * Force a commit with an empty audio chunk.
   */
  commit() {
    if (!this._connected || !this._ws) {
      return;
    }

    this._ws.send(
      JSON.stringify({
        message_type: 'input_audio_chunk',
        audio_base_64: '',
        commit: true,
        sample_rate: 16000,
      }),
    );
  }

  /**
   * Check whether the WebSocket is currently connected.
   * @returns {boolean}
   */
  isConnected() {
    return this._connected;
  }

  /**
   * Close the WebSocket gracefully.
   */
  disconnect() {
    this._connected = false;
    if (this._ws) {
      try {
        this._ws.close(1000, 'Client disconnect');
      } catch {
        // Already closed
      }
      this._ws = null;
    }
  }

  /**
   * Disconnect and remove all event listeners.
   */
  destroy() {
    this.disconnect();
    this.removeAllListeners();
  }

  // -- Event emitter methods --

  /**
   * Register a listener for an event.
   * @param {string} event
   * @param {Function} listener
   * @returns {STTConnection}
   */
  on(event, listener) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(listener);
    return this;
  }

  /**
   * Remove a listener for an event.
   * @param {string} event
   * @param {Function} listener
   * @returns {STTConnection}
   */
  off(event, listener) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
    return this;
  }

  /**
   * Emit an event to all registered listeners.
   * @param {string} event
   * @param {...*} args
   */
  emit(event, ...args) {
    const listeners = this._listeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch {
        // Prevent listener errors from breaking the connection
      }
    }
  }

  /**
   * Remove all listeners, optionally for a specific event.
   * @param {string} [event]
   */
  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }

  // -- Private methods --

  /**
   * Route a parsed STT message to the appropriate event.
   * @param {object} message
   * @private
   */
  _handleMessage(message) {
    const handler = this._messageHandlers[message.message_type];
    if (handler) handler(message);
  }

  /**
   * Check whether a message_type is an error type.
   * @param {string} type
   * @returns {boolean}
   * @private
   */
  _isErrorType(type) {
    return [
      'error',
      'auth_error',
      'rate_limited',
      'quota_exceeded',
      'commit_throttled',
      'input_error',
      'chunk_size_exceeded',
      'transcriber_error',
      'queue_overflow',
      'resource_exhausted',
      'session_time_limit_exceeded',
      'unaccepted_terms',
    ].includes(type);
  }

  /**
   * Clean up WebSocket handlers and close the connection.
   * @private
   */
  _cleanup() {
    if (this._ws) {
      this._ws.onopen = null;
      this._ws.onmessage = null;
      this._ws.onerror = null;
      this._ws.onclose = null;
      try {
        this._ws.close();
      } catch {
        // Ignore
      }
      this._ws = null;
    }
    this._connected = false;
  }
}

export { STTConnection };
export default STTConnection;
