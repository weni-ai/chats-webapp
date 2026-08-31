/**
 * Voice configuration defaults, validation, and API URL builders.
 */

import { VoiceError, VoiceErrorCode } from './errors';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const VALID_TTS_MODELS = ['eleven_flash_v2_5', 'eleven_multilingual_v2'];
const VALID_AUDIO_FORMATS = ['mp3_44100_128', 'pcm_24000'];

export const DEFAULT_VOICE_CONFIG = {
  elevenLabs: {
    voiceId: '',
  },
  languageCode: 'en',
  ttsModel: 'eleven_flash_v2_5',
  sttModel: 'scribe_v2_realtime',
  audioFormat: 'mp3_44100_128',
  sampleRate: 16000,
  silenceThreshold: 1.5,
  vadThreshold: 0.02,
  bargeInVadThreshold: 0.08,
  sttVadThreshold: 0.4,
  minSpeechDuration: 100,
  minSilenceDuration: 100,
  latencyOptimization: 3,
  enableBargeIn: true,
  autoListen: true,
  maxSessionDurationMs: 15 * 60 * 1000,
  idleTimeoutMs: 2 * 60 * 1000,
  hiddenGracePeriodMs: 30 * 1000,
  sttLeadInFrames: 3,
  sttTrailFrames: 8,
  getTokens: null,
  texts: {
    title: '',
    listening: '',
    microphoneHint: '',
    speaking: '',
    processing: '',
    errorTitle: '',
  },
};

/**
 * Validate a voice configuration object.
 * @param {object} config
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateVoiceConfig(config) {
  const errors = [];

  if (typeof config.getTokens !== 'function') {
    errors.push(
      'getTokens must be a function returning Promise<{ sttToken, ttsToken }>',
    );
  }

  if (
    typeof config.silenceThreshold !== 'number' ||
    config.silenceThreshold < 0.3 ||
    config.silenceThreshold > 3.0
  ) {
    errors.push('silenceThreshold must be a number between 0.3 and 3.0');
  }

  if (
    typeof config.vadThreshold !== 'number' ||
    config.vadThreshold < 0.01 ||
    config.vadThreshold > 0.5
  ) {
    errors.push('vadThreshold must be a number between 0.01 and 0.5');
  }

  if (
    !Number.isInteger(config.latencyOptimization) ||
    config.latencyOptimization < 0 ||
    config.latencyOptimization > 4
  ) {
    errors.push('latencyOptimization must be an integer between 0 and 4');
  }

  if (!VALID_TTS_MODELS.includes(config.ttsModel)) {
    errors.push(`ttsModel must be one of: ${VALID_TTS_MODELS.join(', ')}`);
  }

  if (!VALID_AUDIO_FORMATS.includes(config.audioFormat)) {
    errors.push(
      `audioFormat must be one of: ${VALID_AUDIO_FORMATS.join(', ')}`,
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Merge user config with defaults and validate the result.
 * @param {object} userConfig
 * @returns {object} Merged and validated config
 * @throws {VoiceError} If validation fails
 */
export function mergeVoiceConfig(userConfig) {
  const merged = {
    ...DEFAULT_VOICE_CONFIG,
    ...userConfig,
    elevenLabs: {
      ...DEFAULT_VOICE_CONFIG.elevenLabs,
      ...userConfig?.elevenLabs,
      voiceId: userConfig?.elevenLabs?.voiceId || DEFAULT_VOICE_ID,
    },
    silenceThreshold: DEFAULT_VOICE_CONFIG.silenceThreshold,
    enableBargeIn: DEFAULT_VOICE_CONFIG.enableBargeIn,
    autoListen: DEFAULT_VOICE_CONFIG.autoListen,
    texts: {
      ...DEFAULT_VOICE_CONFIG.texts,
      ...userConfig?.texts,
    },
  };

  // Normalize language code to ISO 639-1 (strip BCP-47 region suffix).
  if (merged.languageCode) {
    merged.languageCode = merged.languageCode.split('-')[0].toLowerCase();
  }

  const { valid, errors } = validateVoiceConfig(merged);
  if (!valid) {
    throw new VoiceError(
      VoiceErrorCode.UNKNOWN_ERROR,
      `Invalid voice configuration: ${errors.join('; ')}`,
    );
  }

  return merged;
}

/**
 * Build the ElevenLabs STT WebSocket URL with query parameters.
 * @param {object} config
 * @param {string} token
 * @returns {string}
 */
export function buildSTTWebSocketURL(config, token) {
  const base = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime';
  const params = new URLSearchParams();

  params.set('model_id', config.sttModel);
  params.set('token', token);
  params.set('audio_format', 'pcm_16000');
  params.set('commit_strategy', 'vad');
  params.set('vad_silence_threshold_secs', String(config.silenceThreshold));
  params.set('vad_threshold', String(config.sttVadThreshold));
  params.set('min_speech_duration_ms', String(config.minSpeechDuration));
  params.set('min_silence_duration_ms', String(config.minSilenceDuration));

  if (config.languageCode) {
    params.set('language_code', config.languageCode);
  }

  return `${base}?${params.toString()}`;
}

/**
 * Build the ElevenLabs TTS WebSocket URL with query parameters.
 * Uses single-use token for authentication so no API key reaches the browser.
 * @param {string} voiceId
 * @param {object} config
 * @param {string} token - Single-use tts_websocket token
 * @returns {string}
 */
export function buildTTSWebSocketURL(voiceId, config, token) {
  const resolvedVoiceId = voiceId || DEFAULT_VOICE_ID;
  const base = `wss://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}/stream-input`;
  const params = new URLSearchParams();

  params.set('single_use_token', token);
  params.set('model_id', config.ttsModel);
  params.set('output_format', config.audioFormat);
  params.set('inactivity_timeout', '120');

  if (config.languageCode) {
    params.set('language_code', config.languageCode);
  }

  return `${base}?${params.toString()}`;
}
