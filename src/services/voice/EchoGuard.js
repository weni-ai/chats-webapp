/**
 * Echo cancellation via mic-to-STT gating during TTS playback.
 *
 * Gate microphone audio while TTS is playing and for a short cooldown
 * afterwards, preventing the STT engine from transcribing its own
 * synthesised speech. Barge-in detection uses consecutive voice frame
 * counting against an elevated threshold.
 *
 * @module EchoGuard
 */

const DEFAULT_COOLDOWN_MS = 250;
const DEFAULT_CONSECUTIVE_FRAMES_REQUIRED = 3;
const DEFAULT_NORMAL_THRESHOLD = 0.02;
const DEFAULT_ELEVATED_THRESHOLD = 0.08;

class EchoGuard {
  /**
   * Create an EchoGuard instance.
   *
   * @param {object} [options]
   * @param {number} [options.cooldownMs=250] Milliseconds to keep the gate
   *   active after TTS stops.
   * @param {number} [options.consecutiveFramesRequired=3] Number of
   *   consecutive voice frames needed to trigger barge-in.
   * @param {number} [options.normalThreshold=0.02] Barge-in threshold when
   *   TTS is not playing.
   * @param {number} [options.elevatedThreshold=0.08] Barge-in threshold
   *   while TTS is playing (higher to ignore echo).
   */
  constructor(options = {}) {
    const {
      cooldownMs = DEFAULT_COOLDOWN_MS,
      consecutiveFramesRequired = DEFAULT_CONSECUTIVE_FRAMES_REQUIRED,
      normalThreshold = DEFAULT_NORMAL_THRESHOLD,
      elevatedThreshold = DEFAULT_ELEVATED_THRESHOLD,
    } = options;

    /** @type {number} */
    this._cooldownMs = cooldownMs;

    /** @type {number} */
    this._consecutiveFramesRequired = consecutiveFramesRequired;

    /** @type {number} */
    this._normalThreshold = normalThreshold;

    /** @type {number} */
    this._elevatedThreshold = elevatedThreshold;

    /** @type {boolean} */
    this._isGated = false;

    /** @type {boolean} */
    this._isTTSPlaying = false;

    /** @type {number} */
    this._bargeInThreshold = normalThreshold;

    /** @type {number} */
    this._consecutiveVoiceFrames = 0;

    /** @type {boolean} */
    this._cooldownActive = false;

    /** @type {ReturnType<typeof setTimeout>|null} */
    this._cooldownTimeoutId = null;
  }

  // -- Read-only properties --------------------------------------------------

  /** @returns {boolean} True when audio should NOT be forwarded to STT. */
  get isGated() {
    return this._isGated;
  }

  /** @returns {boolean} True while TTS audio is playing. */
  get isTTSPlaying() {
    return this._isTTSPlaying;
  }

  /** @returns {number} Current barge-in threshold (normal or elevated). */
  get bargeInThreshold() {
    return this._bargeInThreshold;
  }

  // -- Lifecycle methods -----------------------------------------------------

  /**
   * Activate the gate when TTS playback begins.
   *
   * Elevate the barge-in threshold. Only reset the consecutive frame count
   * on the first activation — subsequent calls (new chunks arriving while
   * already playing) must not wipe barge-in progress.
   */
  onTTSStarted() {
    this._clearCooldownTimer();
    if (!this._isTTSPlaying) {
      this._consecutiveVoiceFrames = 0;
    }
    this._isTTSPlaying = true;
    this._isGated = true;
    this._bargeInThreshold = this._elevatedThreshold;
  }

  /**
   * Begin cooldown after TTS playback ends.
   *
   * The gate stays active during cooldown to absorb residual echo. Once
   * the cooldown expires the gate opens and the threshold returns to
   * normal.
   */
  onTTSStopped() {
    this._isTTSPlaying = false;
    this._cooldownActive = true;

    this._clearCooldownTimer();
    this._cooldownTimeoutId = setTimeout(() => {
      this._cooldownTimeoutId = null;
      this._cooldownActive = false;
      this._isGated = false;
      this._bargeInThreshold = this._normalThreshold;
    }, this._cooldownMs);
  }

  /**
   * Immediately deactivate the gate on barge-in.
   *
   * Bypass the cooldown so the user's speech reaches STT without delay.
   */
  onBargeInDetected() {
    this._clearCooldownTimer();
    this._isGated = false;
    this._isTTSPlaying = false;
    this._cooldownActive = false;
    this._bargeInThreshold = this._normalThreshold;
    this._consecutiveVoiceFrames = 0;
  }

  // -- Query methods ---------------------------------------------------------

  /**
   * Determine whether audio should be forwarded to STT.
   *
   * @returns {boolean} True when the gate is open.
   */
  shouldForwardAudio() {
    return !this._isGated;
  }

  /**
   * Determine whether a barge-in should be triggered.
   *
   * Track consecutive voice frames and compare against the required count.
   * Barge-in only fires while TTS is actively playing.
   *
   * @param {boolean} hasVoice - Whether the current frame contains voice
   *   activity above the elevated threshold.
   * @returns {boolean} True when enough consecutive frames have been detected.
   */
  shouldTriggerBargeIn(hasVoice) {
    if (!this._isTTSPlaying) {
      return false;
    }

    if (hasVoice) {
      this._consecutiveVoiceFrames++;
    } else {
      this._consecutiveVoiceFrames = 0;
    }

    return this._consecutiveVoiceFrames >= this._consecutiveFramesRequired;
  }

  // -- Cleanup ---------------------------------------------------------------

  /**
   * Clear all internal state and cancel pending timers.
   */
  reset() {
    this._clearCooldownTimer();
    this._isGated = false;
    this._isTTSPlaying = false;
    this._bargeInThreshold = this._normalThreshold;
    this._consecutiveVoiceFrames = 0;
    this._cooldownActive = false;
  }

  /**
   * Release resources. Alias for reset.
   */
  destroy() {
    this.reset();
  }

  // -- Private helpers -------------------------------------------------------

  /** @private */
  _clearCooldownTimer() {
    if (this._cooldownTimeoutId !== null) {
      clearTimeout(this._cooldownTimeoutId);
      this._cooldownTimeoutId = null;
    }
  }
}

export { EchoGuard };
export default EchoGuard;
