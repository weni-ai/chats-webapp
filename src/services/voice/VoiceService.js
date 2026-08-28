/**
 * Voice mode orchestrator.
 * Coordinate AudioCapture, STTConnection, TTSPlayer, TextChunker, and EchoGuard
 * through a 6-state machine: idle → initializing → listening → processing → speaking → error.
 *
 * Authentication uses single-use tokens obtained via `config.getTokens()`.
 * Neither the ElevenLabs API key nor long-lived credentials ever reach the browser.
 */

import { AudioCapture } from './AudioCapture';
import { STTConnection } from './STTConnection';
import { TTSPlayer } from './TTSPlayer';
import { TextChunker } from './TextChunker';
import { EchoGuard } from './EchoGuard';
import { SessionGuard } from './SessionGuard';
import { sanitizeForTTS } from './sanitizeForTTS';
import { VoiceError, VoiceErrorCode, createVoiceError } from './errors';
import { mergeVoiceConfig, buildTTSWebSocketURL } from './config';

export const VoiceSessionState = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

let idCounter = 0;
function generateSessionId() {
  idCounter += 1;
  return `voice-${Date.now()}-${idCounter}`;
}

const NON_SPEAKABLE =
  /^[\p{Extended_Pictographic}\s]+$|^https?:\/\/\S+$|^```[\s\S]*```$/u;

export class VoiceService {
  static NON_SPEAKABLE = NON_SPEAKABLE;

  constructor() {
    this.config = null;
    this.state = VoiceSessionState.IDLE;
    this.sessionId = null;
    this.sessionStartTime = null;
    this.audioCapture = null;
    this.sttConnection = null;
    this.ttsPlayer = null;
    this.textChunker = null;
    this.echoGuard = null;
    this.sessionGuard = null;
    this.partialTranscript = '';
    this.error = null;
    this.currentTokens = null;
    this.listeners = new Map();
    this.onMessageCallback = null;

    this._leadInBuffer = [];
    this._isForwardingToSTT = false;
    this._trailingSilenceFrames = 0;
    this._isReconnectingSTT = false;
  }

  /** Check browser support for voice mode. */
  static isSupported() {
    return (
      AudioCapture.isSupported() &&
      typeof WebSocket !== 'undefined' &&
      typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined'
    );
  }

  /**
   * Initialize with merged config and create sub-components.
   * @param {object} config - User voice configuration
   */
  async init(config) {
    this.config = mergeVoiceConfig(config);

    this.audioCapture = new AudioCapture();
    this.ttsPlayer = new TTSPlayer({
      getConnectionUrl: () => this._buildTTSConnectionUrl(),
    });
    this.textChunker = new TextChunker();
    this.echoGuard = new EchoGuard({
      cooldownMs: 350,
      consecutiveFramesRequired: 2,
      normalThreshold: 0.02,
      elevatedThreshold: 0.06,
    });
    this.sessionGuard = new SessionGuard({
      maxSessionDurationMs: this.config.maxSessionDurationMs,
      idleTimeoutMs: this.config.idleTimeoutMs,
      hiddenGracePeriodMs: this.config.hiddenGracePeriodMs,
    });

    this._wireAudioCaptureListeners();
    this._wireTTSListeners();
  }

  /**
   * Start a voice session: acquire mic, connect STT + TTS, begin listening.
   * @returns {{ id: string, startedAt: number }}
   */
  async startSession() {
    if (this.state !== VoiceSessionState.IDLE) {
      throw createVoiceError(
        VoiceErrorCode.UNKNOWN_ERROR,
        'Cannot start session: not in IDLE state',
      );
    }

    this.setState(VoiceSessionState.INITIALIZING);

    try {
      this.currentTokens = await this.config.getTokens();

      this.sttConnection = new STTConnection(
        this.config,
        this.currentTokens.sttToken,
      );

      await this.audioCapture.start({ vadThreshold: this.config.vadThreshold });

      await this.sttConnection.connect();
      this._wireSTTListeners();

      const ttsUrl = buildTTSWebSocketURL(
        this.config.elevenLabs.voiceId,
        this.config,
        this.currentTokens.ttsToken,
      );
      await this.ttsPlayer.connect(ttsUrl);

      this.sessionId = generateSessionId();
      this.sessionStartTime = Date.now();

      this.sessionGuard?.start({
        onTimeout: () => this._onSessionTimeout(),
        onIdle: () => this._onIdleTimeout(),
        onHidden: () => this._onTabHidden(),
        onVisible: () => this._onTabVisible(),
        onHiddenExpired: () => this._onHiddenExpired(),
      });

      this.setState(VoiceSessionState.LISTENING);
      this.emit('session:started', {
        id: this.sessionId,
        startedAt: this.sessionStartTime,
      });
      this.emit('listening:started');

      return { id: this.sessionId, startedAt: this.sessionStartTime };
    } catch (err) {
      this.error =
        err instanceof VoiceError
          ? err
          : createVoiceError(VoiceErrorCode.UNKNOWN_ERROR, err);
      this.setState(VoiceSessionState.ERROR);
      this.emit('error', this.error);
      throw this.error;
    }
  }

  /**
   * End the current session and release all resources.
   * @param {string} [reason='user'] - Why the session ended
   */
  endSession(reason = 'user') {
    const duration = this.sessionStartTime
      ? Date.now() - this.sessionStartTime
      : 0;
    const prevSessionId = this.sessionId;

    this.audioCapture?.stop();
    this.sttConnection?.destroy();
    this.ttsPlayer?.stop(true);
    this.ttsPlayer?.disconnect();
    this.textChunker?.clear();
    this.echoGuard?.reset();
    this.sessionGuard?.stop();
    this._resetSilenceFilter();

    this.partialTranscript = '';
    this.error = null;
    this.currentTokens = null;
    this.sessionId = null;
    this.sessionStartTime = null;
    this.sttConnection = null;

    this.setState(VoiceSessionState.IDLE);
    this.emit('session:ended', {
      sessionId: prevSessionId,
      duration,
      reason,
    });
    this.emit('listening:stopped');
  }

  /**
   * Feed agent text into the TextChunker → TTSPlayer pipeline.
   * @param {string} textChunk - Incoming text fragment
   * @param {boolean} [isComplete=false] - Whether this is the final fragment
   */
  processTextChunk(textChunk, isComplete = false) {
    if (!this.textChunker || !this.ttsPlayer) return;
    if (VoiceService.NON_SPEAKABLE.test(textChunk)) return;

    if (this.partialTranscript) {
      this.partialTranscript = '';
      this.emit('transcript:partial', { text: '' });
    }

    const chunk = sanitizeForTTS(this.textChunker.addText(textChunk));
    if (chunk) this._speak(chunk);

    if (isComplete) {
      const remaining = sanitizeForTTS(this.textChunker.flush());
      if (remaining) this._speak(remaining);
    }
  }

  /**
   * Stop TTS playback.
   * @param {boolean} [immediate=true]
   */
  stopSpeaking(immediate = true) {
    this.ttsPlayer?.stop(immediate);
    this.textChunker?.clear();
  }

  /** Register the callback invoked when STT commits a transcript. */
  setMessageCallback(callback) {
    this.onMessageCallback = callback;
  }

  /** Update language for subsequent STT/TTS requests. */
  setLanguage(languageCode) {
    if (this.config && languageCode) {
      this.config.languageCode = languageCode.split('-')[0].toLowerCase();
    }
  }

  /** Return current session info or null if inactive. */
  getSession() {
    if (!this.sessionId) return null;
    return {
      id: this.sessionId,
      state: this.state,
      startedAt: this.sessionStartTime,
      config: this.config,
      partialTranscript: this.partialTranscript,
      isPlaying: this.ttsPlayer?.isPlaying ?? false,
      error: this.error,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal: state, events, wiring
  // ---------------------------------------------------------------------------

  /** @private */
  setState(newState) {
    if (this.state === newState) return;
    const previousState = this.state;
    this.state = newState;
    this.emit('state:changed', { state: newState, previousState });
  }

  /** @private */
  _wireAudioCaptureListeners() {
    this.audioCapture.on('audioData', (data) => {
      if (this.state === VoiceSessionState.SPEAKING) {
        const hasVoiceAtThreshold =
          data.energy > this.echoGuard.bargeInThreshold;
        if (this.echoGuard.shouldTriggerBargeIn(hasVoiceAtThreshold)) {
          this._handleBargeIn();
          return;
        }
      }

      if (
        this.echoGuard.shouldForwardAudio() &&
        this.sttConnection?.isConnected()
      ) {
        this._forwardWithSilenceFilter(data);
      }
    });

    this.audioCapture.on('voiceActivity', (data) => {
      if (data.speaking) {
        if (this.state === VoiceSessionState.LISTENING) {
          this.setState(VoiceSessionState.PROCESSING);
        }
      }
    });
  }

  /** @private */
  _wireSTTListeners() {
    const stt = this.sttConnection;

    stt.on('partial', (data) => {
      if (this.state === VoiceSessionState.SPEAKING) return;
      this.partialTranscript = data.text;
      this.emit('transcript:partial', { text: data.text });
    });

    stt.on('committed', (data) => {
      this.sessionGuard?.recordActivity();
      const text = data.text?.trim();
      if (text) {
        this.partialTranscript = '';
        this.emit('transcript:committed', { text });
        this.onMessageCallback?.(text);
      }
      if (this.state !== VoiceSessionState.SPEAKING) {
        this.setState(VoiceSessionState.LISTENING);
      }
    });

    stt.on('error', (err) => {
      this.error =
        err instanceof VoiceError
          ? err
          : createVoiceError(VoiceErrorCode.STT_TRANSCRIPTION_FAILED, err);
      this.emit('error', this.error);
    });

    stt.on('close', () => {
      const reconnectStates = [
        VoiceSessionState.LISTENING,
        VoiceSessionState.PROCESSING,
        VoiceSessionState.SPEAKING,
      ];
      if (reconnectStates.includes(this.state)) {
        this._reconnectSTT();
      }
    });
  }

  /** @private */
  async _reconnectSTT() {
    if (this._isReconnectingSTT) return;
    this._isReconnectingSTT = true;

    const oldStt = this.sttConnection;

    try {
      this.currentTokens = await this.config.getTokens();
      const newStt = new STTConnection(
        this.config,
        this.currentTokens.sttToken,
      );
      await newStt.connect();

      oldStt?.destroy();

      this.sttConnection = newStt;
      this._wireSTTListeners();
      this._resetSilenceFilter();
    } catch (err) {
      const voiceErr =
        err instanceof VoiceError
          ? err
          : createVoiceError(VoiceErrorCode.STT_CONNECTION_FAILED, err);
      this.error = voiceErr;
      this.emit('error', voiceErr);
      this.setState(VoiceSessionState.ERROR);
    } finally {
      this._isReconnectingSTT = false;
    }
  }

  /**
   * Build a fresh TTS WebSocket URL.  Called by TTSPlayer when it needs
   * to (re)connect — fetches new tokens automatically.
   * @private
   * @returns {Promise<string>}
   */
  async _buildTTSConnectionUrl() {
    this.currentTokens = await this.config.getTokens();
    return buildTTSWebSocketURL(
      this.config.elevenLabs.voiceId,
      this.config,
      this.currentTokens.ttsToken,
    );
  }

  /** @private Wire permanent TTS listeners once during init. */
  _wireTTSListeners() {
    this.ttsPlayer.on('queue:drained', () => {
      this.echoGuard.onTTSStopped();
      if (this.state === VoiceSessionState.SPEAKING) {
        this.setState(VoiceSessionState.LISTENING);
        this.emit('speaking:ended');
        this.emit('listening:started');
      }
    });
  }

  /** @private */
  _speak(text) {
    this.echoGuard.onTTSStarted();
    this.sessionGuard?.recordActivity();
    this._resetSilenceFilter();
    this.setState(VoiceSessionState.SPEAKING);
    this.emit('speaking:started', { text });

    this.ttsPlayer.speak(text).catch((err) => {
      if (this.state !== VoiceSessionState.SPEAKING) return;

      this.emit(
        'error',
        createVoiceError(VoiceErrorCode.TTS_GENERATION_FAILED, err),
      );
      this.echoGuard.onTTSStopped();
      this.setState(VoiceSessionState.LISTENING);
      this.emit('listening:started');
    });
  }

  /** @private */
  _handleBargeIn() {
    this.setState(VoiceSessionState.LISTENING);
    this.ttsPlayer?.stop(false, true);
    this.textChunker?.clear();
    this.echoGuard.onBargeInDetected();
    this.audioCapture?.resetSpeakingState();
    this.sessionGuard?.recordActivity();
    this._resetSilenceFilter();
    this.emit('barge-in');
  }

  // ---------------------------------------------------------------------------
  // Silence filter: avoid sending silence to STT to reduce billing
  // ---------------------------------------------------------------------------

  /**
   * Buffer silence frames locally and only forward to STT when voice
   * is detected (with a lead-in context) and for a trailing period
   * after voice stops (so server-side VAD can commit).
   * @private
   */
  _forwardWithSilenceFilter(data) {
    const { data: audioData, sampleRate, hasVoice } = data;
    const leadInMax = this.config.sttLeadInFrames ?? 3;
    const trailMax = this.config.sttTrailFrames ?? 8;

    if (hasVoice) {
      for (const buffered of this._leadInBuffer) {
        this.sttConnection.sendAudio(buffered.data, buffered.sampleRate, false);
      }
      this._leadInBuffer = [];
      this._isForwardingToSTT = true;
      this._trailingSilenceFrames = 0;
      this.sttConnection.sendAudio(audioData, sampleRate, false);
      return;
    }

    if (this._isForwardingToSTT) {
      this._trailingSilenceFrames++;
      if (this._trailingSilenceFrames <= trailMax) {
        this.sttConnection.sendAudio(audioData, sampleRate, false);
      } else {
        this.sttConnection.commit();
        this._isForwardingToSTT = false;
        this._trailingSilenceFrames = 0;
        this._leadInBuffer = [];
      }
      return;
    }

    this._leadInBuffer.push({ data: audioData, sampleRate });
    if (this._leadInBuffer.length > leadInMax) {
      this._leadInBuffer.shift();
    }
  }

  /** @private */
  _resetSilenceFilter() {
    this._leadInBuffer = [];
    this._isForwardingToSTT = false;
    this._trailingSilenceFrames = 0;
  }

  // ---------------------------------------------------------------------------
  // Session guard callbacks
  // ---------------------------------------------------------------------------

  /** @private */
  _onSessionTimeout() {
    this.emit('session:timeout', { reason: 'max_duration' });
    this.endSession('max_duration');
  }

  /** @private */
  _onIdleTimeout() {
    this.emit('session:timeout', { reason: 'idle' });
    this.endSession('idle');
  }

  /** @private */
  _onTabHidden() {
    this.audioCapture?.pause();
    this._resetSilenceFilter();
    this.emit('session:paused', { reason: 'tab_hidden' });
  }

  /** @private */
  _onTabVisible() {
    this.audioCapture?.resume();
    this.sessionGuard?.recordActivity();
    this.emit('session:resumed');
  }

  /** @private */
  _onHiddenExpired() {
    this.emit('session:timeout', { reason: 'tab_hidden' });
    this.endSession('tab_hidden');
  }

  // ---------------------------------------------------------------------------
  // Event system
  // ---------------------------------------------------------------------------

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return this;
  }

  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
    return this;
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch {
        /* listener errors must not break orchestrator */
      }
    });
  }

  removeAllListeners() {
    this.listeners.clear();
  }

  /** Tear down everything and release all references. */
  destroy() {
    this.endSession();
    this.audioCapture?.destroy();
    this.ttsPlayer?.destroy();
    this.echoGuard?.destroy();
    this.sessionGuard?.destroy();
    this.audioCapture = null;
    this.ttsPlayer = null;
    this.textChunker = null;
    this.echoGuard = null;
    this.sessionGuard = null;
    this.onMessageCallback = null;
    this.removeAllListeners();
    this.config = null;
  }
}
