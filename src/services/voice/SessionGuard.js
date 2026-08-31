/**
 * Safety controls for voice sessions.
 *
 * Enforce maximum session duration, idle timeout, and tab-visibility
 * policies to prevent runaway microphone usage and ElevenLabs billing.
 */

const DEFAULT_MAX_DURATION_MS = 15 * 60 * 1000;
const DEFAULT_IDLE_TIMEOUT_MS = 4 * 60 * 1000;
const DEFAULT_HIDDEN_GRACE_MS = 30 * 1000;

class SessionGuard {
  /**
   * @param {object} [options]
   * @param {number} [options.maxSessionDurationMs]
   * @param {number} [options.idleTimeoutMs]
   * @param {number} [options.hiddenGracePeriodMs]
   */
  constructor(options = {}) {
    this._maxDurationMs =
      options.maxSessionDurationMs ?? DEFAULT_MAX_DURATION_MS;
    this._idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    this._hiddenGraceMs =
      options.hiddenGracePeriodMs ?? DEFAULT_HIDDEN_GRACE_MS;

    this._maxDurationTimer = null;
    this._idleTimer = null;
    this._hiddenTimer = null;
    this._boundVisibilityHandler = null;

    this._callbacks = null;
    this._isTabHidden = false;
    this._active = false;
  }

  /**
   * Activate all session guards.
   * @param {object} callbacks
   * @param {Function} callbacks.onTimeout
   * @param {Function} callbacks.onIdle
   * @param {Function} callbacks.onHidden
   * @param {Function} callbacks.onVisible
   * @param {Function} callbacks.onHiddenExpired
   */
  start(callbacks) {
    this._callbacks = callbacks;
    this._active = true;
    this._isTabHidden = false;

    this._startMaxDurationTimer();
    this._resetIdleTimer();
    this._bindVisibilityListener();
  }

  /** Signal user activity to reset the idle timer. */
  recordActivity() {
    if (!this._active) return;
    this._resetIdleTimer();
  }

  /** Deactivate all guards and clear timers. */
  stop() {
    this._active = false;
    this._clearAllTimers();
    this._unbindVisibilityListener();
  }

  /** Release all resources and references. */
  destroy() {
    this.stop();
    this._callbacks = null;
  }

  // -- Max duration ----------------------------------------------------------

  /** @private */
  _startMaxDurationTimer() {
    this._clearTimer('_maxDurationTimer');
    this._maxDurationTimer = setTimeout(() => {
      this._maxDurationTimer = null;
      if (this._active) {
        this._callbacks?.onTimeout?.();
      }
    }, this._maxDurationMs);
  }

  // -- Idle timeout ----------------------------------------------------------

  /** @private */
  _resetIdleTimer() {
    this._clearTimer('_idleTimer');
    this._idleTimer = setTimeout(() => {
      this._idleTimer = null;
      if (this._active) {
        this._callbacks?.onIdle?.();
      }
    }, this._idleTimeoutMs);
  }

  // -- Visibility ------------------------------------------------------------

  /** @private */
  _bindVisibilityListener() {
    if (typeof document === 'undefined') return;

    this._boundVisibilityHandler = () => {
      this._onVisibilityChange();
    };
    document.addEventListener('visibilitychange', this._boundVisibilityHandler);
  }

  /** @private */
  _unbindVisibilityListener() {
    if (this._boundVisibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this._boundVisibilityHandler,
      );
    }
    this._boundVisibilityHandler = null;
    this._clearTimer('_hiddenTimer');
    this._isTabHidden = false;
  }

  /** @private */
  _onVisibilityChange() {
    if (!this._active) return;

    const hidden = typeof document !== 'undefined' && document.hidden;

    if (hidden && !this._isTabHidden) {
      this._isTabHidden = true;
      this._callbacks?.onHidden?.();
      this._startHiddenGraceTimer();
    } else if (!hidden && this._isTabHidden) {
      this._isTabHidden = false;
      this._clearTimer('_hiddenTimer');
      this._callbacks?.onVisible?.();
    }
  }

  /** @private */
  _startHiddenGraceTimer() {
    this._clearTimer('_hiddenTimer');
    this._hiddenTimer = setTimeout(() => {
      this._hiddenTimer = null;
      if (this._active && this._isTabHidden) {
        this._callbacks?.onHiddenExpired?.();
      }
    }, this._hiddenGraceMs);
  }

  // -- Cleanup ---------------------------------------------------------------

  /** @private */
  _clearTimer(field) {
    if (this[field] !== null) {
      clearTimeout(this[field]);
      this[field] = null;
    }
  }

  /** @private */
  _clearAllTimers() {
    this._clearTimer('_maxDurationTimer');
    this._clearTimer('_idleTimer');
    this._clearTimer('_hiddenTimer');
  }
}

export { SessionGuard };
export default SessionGuard;
