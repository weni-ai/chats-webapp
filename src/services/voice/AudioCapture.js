/**
 * Capture microphone audio, run local VAD, and emit base64 PCM chunks.
 * Use ScriptProcessorNode for broad browser compat (including older WebViews).
 */
import {
  floatTo16BitPCM,
  int16ToBase64,
  downsampleBuffer,
  calculateRMS,
  AUDIO_CONSTANTS,
} from '@/utils/audioUtils';
import { VoiceError, VoiceErrorCode, getMediaErrorCode } from './errors';

const WATCHDOG_INTERVAL_MS = 2000;
const WATCHDOG_TIMEOUT_MS = 3000;

export class AudioCapture {
  constructor() {
    this.isCapturing = false;
    this.isSpeaking = false;
    this.silenceStartTime = 0;
    this.vadThreshold = AUDIO_CONSTANTS.VAD_THRESHOLD;
    this.lastAudioFrameTime = 0;

    this.stream = null;
    this.audioContext = null;
    this.sourceNode = null;
    this.processorNode = null;
    this.mutedGainNode = null;
    this.watchdogTimer = null;

    /** @type {Map<string, Function[]>} */
    this.listeners = new Map();
  }

  /**
   * Check whether the browser supports audio capture.
   * @returns {boolean}
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices?.getUserMedia &&
      (window.AudioContext || window.webkitAudioContext)
    );
  }

  /**
   * Request microphone permission and return whether it was granted.
   * @returns {Promise<boolean>}
   */
  static async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Query current microphone permission state without prompting.
   * @returns {Promise<PermissionState>}
   */
  static async checkPermission() {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' });
      return status.state;
    } catch {
      return 'prompt';
    }
  }

  /**
   * Start capturing audio from the microphone.
   * @param {{ vadThreshold?: number }} [options={}]
   */
  async start(options = {}) {
    if (this.isCapturing) return;
    if (!AudioCapture.isSupported()) {
      throw new VoiceError(VoiceErrorCode.BROWSER_NOT_SUPPORTED);
    }
    if (options.vadThreshold !== undefined) {
      this.vadThreshold = options.vadThreshold;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: AUDIO_CONSTANTS.TARGET_SAMPLE_RATE },
        },
      });
    } catch (err) {
      throw new VoiceError(getMediaErrorCode(err), undefined, err);
    }

    try {
      this._setupAudioPipeline();
    } catch (err) {
      this._stopStream();
      throw new VoiceError(
        VoiceErrorCode.UNKNOWN_ERROR,
        'Failed to initialize audio pipeline',
        err,
      );
    }

    this.isCapturing = true;
    this.lastAudioFrameTime = Date.now();
    this._startWatchdog();
  }

  /** Stop capturing and release all resources. */
  stop() {
    this.isCapturing = false;
    this._stopWatchdog();
    this._disconnectNodes();
    this._closeAudioContext();
    this._stopStream();
    this.resetSpeakingState();
  }

  /** Pause audio processing without releasing the stream. */
  pause() {
    this.isCapturing = false;
  }

  /** Resume audio processing if the stream is still active. */
  resume() {
    if (this.stream?.active) {
      this.isCapturing = true;
      this.lastAudioFrameTime = Date.now();
    }
  }

  /** Reset local speaking/silence tracking state. */
  resetSpeakingState() {
    this.isSpeaking = false;
    this.silenceStartTime = 0;
  }

  /** Stop capture and remove all event listeners. */
  destroy() {
    this.stop();
    this.removeAllListeners();
  }

  // -- Event emitter ----------------------------------------------------------

  /** @param {string} event @param {Function} callback */
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
  }

  /** @param {string} event @param {Function} callback */
  off(event, callback) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      const i = cbs.indexOf(callback);
      if (i > -1) cbs.splice(i, 1);
    }
  }

  /** @param {string} event @param {*} data */
  emit(event, data) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.forEach((cb) => {
        try {
          cb(data);
        } catch {
          // Prevent listener errors from disrupting audio processing
        }
      });
    }
  }

  removeAllListeners() {
    this.listeners.clear();
  }

  // -- Internal: audio pipeline -----------------------------------------------

  /** @private Wire up AudioContext, ScriptProcessorNode, and GainNode. */
  _setupAudioPipeline() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioCtx({
      sampleRate: AUDIO_CONSTANTS.TARGET_SAMPLE_RATE,
    });

    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.processorNode = this.audioContext.createScriptProcessor(
      AUDIO_CONSTANTS.BUFFER_SIZE,
      1,
      1,
    );
    this.mutedGainNode = this.audioContext.createGain();
    this.mutedGainNode.gain.value = 0;

    this.processorNode.onaudioprocess = (e) => this._onAudioProcess(e);

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.mutedGainNode);
    this.mutedGainNode.connect(this.audioContext.destination);
  }

  /** @private Handle each audio processing frame. */
  _onAudioProcess(event) {
    if (!this.isCapturing) return;
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.lastAudioFrameTime = Date.now();

    const inputBuffer = event.inputBuffer.getChannelData(0);
    const browserRate = this.audioContext.sampleRate;
    const targetRate = AUDIO_CONSTANTS.TARGET_SAMPLE_RATE;

    const samples =
      browserRate !== targetRate
        ? downsampleBuffer(inputBuffer, browserRate, targetRate)
        : inputBuffer;

    const energy = calculateRMS(samples);
    const hasVoice = energy > this.vadThreshold;
    this._updateVoiceState(hasVoice);

    const pcm16 = floatTo16BitPCM(samples);
    const base64 = int16ToBase64(pcm16);
    this.emit('audioData', {
      data: base64,
      sampleRate: targetRate,
      hasVoice,
      energy,
    });
  }

  /** @private Track speaking/silence transitions and emit events. */
  _updateVoiceState(hasVoice) {
    if (hasVoice) {
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.emit('voiceActivity', { speaking: true });
      }
      this.silenceStartTime = 0;
      return;
    }

    if (!this.isSpeaking) return;

    if (this.silenceStartTime === 0) {
      this.silenceStartTime = Date.now();
    }
    this.emit('silenceDetected', {
      duration: Date.now() - this.silenceStartTime,
    });
  }

  // -- Internal: watchdog -----------------------------------------------------

  /** @private Start periodic health check for audio frames. */
  _startWatchdog() {
    this._stopWatchdog();
    this.watchdogTimer = setInterval(
      () => this._checkHealth(),
      WATCHDOG_INTERVAL_MS,
    );
  }

  /** @private */
  _stopWatchdog() {
    if (this.watchdogTimer !== null) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  /** @private Verify audio frames still arrive; attempt recovery if stalled. */
  _checkHealth() {
    if (!this.isCapturing) return;
    const elapsed = Date.now() - this.lastAudioFrameTime;
    if (elapsed < WATCHDOG_TIMEOUT_MS) return;

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    if (this.stream && !this.stream.active) {
      this.emit(
        'error',
        new VoiceError(
          VoiceErrorCode.MICROPHONE_NOT_FOUND,
          'Microphone stream ended unexpectedly',
        ),
      );
      this.stop();
    }
  }

  // -- Internal: cleanup ------------------------------------------------------

  /** @private */
  _disconnectNodes() {
    try {
      this.processorNode?.disconnect();
    } catch {
      /* already disconnected */
    }
    try {
      this.sourceNode?.disconnect();
    } catch {
      /* already disconnected */
    }
    try {
      this.mutedGainNode?.disconnect();
    } catch {
      /* already disconnected */
    }
    if (this.processorNode) this.processorNode.onaudioprocess = null;
    this.processorNode = null;
    this.sourceNode = null;
    this.mutedGainNode = null;
  }

  /** @private */
  _closeAudioContext() {
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        /* ignore */
      }
      this.audioContext = null;
    }
  }

  /** @private */
  _stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}
