/**
 * Voice error types and utilities.
 * Handle all ElevenLabs API error message_types.
 */

export const VoiceErrorCode = {
  MICROPHONE_PERMISSION_DENIED: 'MICROPHONE_PERMISSION_DENIED',
  MICROPHONE_NOT_FOUND: 'MICROPHONE_NOT_FOUND',
  BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
  STT_CONNECTION_FAILED: 'STT_CONNECTION_FAILED',
  STT_AUTH_FAILED: 'STT_AUTH_FAILED',
  STT_TRANSCRIPTION_FAILED: 'STT_TRANSCRIPTION_FAILED',
  TTS_CONNECTION_FAILED: 'TTS_CONNECTION_FAILED',
  TTS_AUTH_FAILED: 'TTS_AUTH_FAILED',
  TTS_GENERATION_FAILED: 'TTS_GENERATION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',
  SESSION_IDLE_TIMEOUT: 'SESSION_IDLE_TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

const ERROR_METADATA = {
  [VoiceErrorCode.MICROPHONE_PERMISSION_DENIED]: {
    message: 'Microphone access was denied',
    suggestion: 'Please allow microphone access in your browser settings',
    recoverable: true,
  },
  [VoiceErrorCode.MICROPHONE_NOT_FOUND]: {
    message: 'No microphone was found',
    suggestion: 'Please connect a microphone and try again',
    recoverable: false,
  },
  [VoiceErrorCode.BROWSER_NOT_SUPPORTED]: {
    message: 'Your browser does not support voice mode',
    suggestion: 'Please use Chrome, Firefox, Safari or Edge',
    recoverable: false,
  },
  [VoiceErrorCode.STT_CONNECTION_FAILED]: {
    message: 'Could not connect to the speech recognition service',
    suggestion: 'Check your connection and try again',
    recoverable: true,
  },
  [VoiceErrorCode.STT_AUTH_FAILED]: {
    message: 'ElevenLabs authentication failed',
    suggestion:
      'Check the API key and plan permissions (Scribe v2 Realtime required)',
    recoverable: false,
  },
  [VoiceErrorCode.STT_TRANSCRIPTION_FAILED]: {
    message: 'Speech recognition failed',
    suggestion: 'Please try speaking again',
    recoverable: true,
  },
  [VoiceErrorCode.TTS_CONNECTION_FAILED]: {
    message: 'Could not connect to the text-to-speech service',
    suggestion: 'Check your connection and try again',
    recoverable: true,
  },
  [VoiceErrorCode.TTS_AUTH_FAILED]: {
    message: 'Text-to-speech authentication failed',
    suggestion: 'Reconnecting...',
    recoverable: true,
  },
  [VoiceErrorCode.TTS_GENERATION_FAILED]: {
    message: 'Could not generate speech',
    suggestion: 'The response will be shown as text',
    recoverable: true,
  },
  [VoiceErrorCode.NETWORK_ERROR]: {
    message: 'Network connection lost',
    suggestion: 'Please check your internet connection',
    recoverable: true,
  },
  [VoiceErrorCode.TOKEN_EXPIRED]: {
    message: 'Authentication expired',
    suggestion: 'Reconnecting...',
    recoverable: true,
  },
  [VoiceErrorCode.RATE_LIMITED]: {
    message: 'Too many requests',
    suggestion: 'Please wait a moment and try again',
    recoverable: true,
  },
  [VoiceErrorCode.SESSION_TIMEOUT]: {
    message: 'Voice session reached maximum duration',
    suggestion: 'Please start a new session',
    recoverable: true,
  },
  [VoiceErrorCode.SESSION_IDLE_TIMEOUT]: {
    message: 'Session ended due to inactivity',
    suggestion: 'Say something to start a new session',
    recoverable: true,
  },
  [VoiceErrorCode.UNKNOWN_ERROR]: {
    message: 'An unexpected error occurred',
    suggestion: 'Please try again',
    recoverable: true,
  },
};

export class VoiceError extends Error {
  /**
   * Create a voice-specific error with code, metadata, and optional cause.
   * @param {string} code - A VoiceErrorCode value
   * @param {string} [customMessage]
   * @param {Error} [originalError]
   */
  constructor(code, customMessage, originalError) {
    const metadata =
      ERROR_METADATA[code] || ERROR_METADATA[VoiceErrorCode.UNKNOWN_ERROR];
    super(customMessage || metadata.message);

    this.name = 'VoiceError';
    this.code = code;
    this.suggestion = metadata.suggestion;
    this.recoverable = metadata.recoverable;
    this.originalError = originalError || null;
  }

  /** @returns {{ code: string, message: string, suggestion: string, recoverable: boolean }} */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      suggestion: this.suggestion,
      recoverable: this.recoverable,
    };
  }
}

/**
 * Create a VoiceError from a code and an optional error or message.
 * @param {string} code - A VoiceErrorCode value
 * @param {Error|string} [errorOrMessage]
 * @returns {VoiceError}
 */
export function createVoiceError(code, errorOrMessage) {
  if (errorOrMessage instanceof Error) {
    return new VoiceError(code, errorOrMessage.message, errorOrMessage);
  }
  return new VoiceError(code, errorOrMessage);
}

/**
 * Map getUserMedia errors to VoiceErrorCode.
 * @param {Error} error
 * @returns {string}
 */
const MEDIA_ERROR_MAP = {
  NotAllowedError: VoiceErrorCode.MICROPHONE_PERMISSION_DENIED,
  PermissionDeniedError: VoiceErrorCode.MICROPHONE_PERMISSION_DENIED,
  NotFoundError: VoiceErrorCode.MICROPHONE_NOT_FOUND,
  DevicesNotFoundError: VoiceErrorCode.MICROPHONE_NOT_FOUND,
  NotSupportedError: VoiceErrorCode.BROWSER_NOT_SUPPORTED,
};

export function getMediaErrorCode(error) {
  return MEDIA_ERROR_MAP[error?.name] ?? VoiceErrorCode.UNKNOWN_ERROR;
}

/**
 * Map WebSocket/STT connection errors to VoiceErrorCode.
 * @param {Error} error
 * @returns {string}
 */
export function getWebSocketErrorCode(error) {
  const msg = (error?.message || '').toLowerCase();

  if (
    msg.includes('401') ||
    msg.includes('unauthorized') ||
    msg.includes('token')
  ) {
    return VoiceErrorCode.TOKEN_EXPIRED;
  }
  if (msg.includes('429') || msg.includes('rate limit')) {
    return VoiceErrorCode.RATE_LIMITED;
  }
  if (msg.includes('network') || msg.includes('connection')) {
    return VoiceErrorCode.NETWORK_ERROR;
  }
  return VoiceErrorCode.STT_CONNECTION_FAILED;
}

/**
 * Map ElevenLabs API message_type to VoiceErrorCode.
 * @param {string} messageType
 * @returns {string}
 */
const STT_MESSAGE_ERROR_MAP = {
  error: VoiceErrorCode.STT_TRANSCRIPTION_FAILED,
  input_error: VoiceErrorCode.STT_TRANSCRIPTION_FAILED,
  chunk_size_exceeded: VoiceErrorCode.STT_TRANSCRIPTION_FAILED,
  transcriber_error: VoiceErrorCode.STT_TRANSCRIPTION_FAILED,
  auth_error: VoiceErrorCode.TOKEN_EXPIRED,
  rate_limited: VoiceErrorCode.RATE_LIMITED,
  quota_exceeded: VoiceErrorCode.RATE_LIMITED,
  commit_throttled: VoiceErrorCode.RATE_LIMITED,
  queue_overflow: VoiceErrorCode.RATE_LIMITED,
  resource_exhausted: VoiceErrorCode.STT_CONNECTION_FAILED,
  session_time_limit_exceeded: VoiceErrorCode.STT_CONNECTION_FAILED,
  unaccepted_terms: VoiceErrorCode.UNKNOWN_ERROR,
};

export function getSTTMessageErrorCode(messageType) {
  return STT_MESSAGE_ERROR_MAP[messageType] ?? VoiceErrorCode.UNKNOWN_ERROR;
}

/**
 * Map TTS WebSocket errors to VoiceErrorCode.
 * @param {Error|CloseEvent|{code?:number,message?:string}} error
 * @returns {string}
 */
export function getTTSErrorCode(error) {
  const code = error?.code;
  if (code === 1008 || code === 401) {
    return VoiceErrorCode.TTS_AUTH_FAILED;
  }
  if (code === 429) {
    return VoiceErrorCode.RATE_LIMITED;
  }

  const msg = (error?.message || '').toLowerCase();
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('connection')
  ) {
    return VoiceErrorCode.NETWORK_ERROR;
  }

  return VoiceErrorCode.TTS_GENERATION_FAILED;
}
