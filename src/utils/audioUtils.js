/**
 * Audio utility functions for voice mode.
 * Pure helper functions — no state.
 */

export const AUDIO_CONSTANTS = {
  TARGET_SAMPLE_RATE: 16000,
  BROWSER_SAMPLE_RATE: 48000,
  BUFFER_SIZE: 4096,
  VAD_THRESHOLD: 0.01,
};

/**
 * Convert Float32 audio samples to 16-bit PCM.
 * @param {Float32Array} float32Array
 * @returns {Int16Array}
 */
export function floatTo16BitPCM(float32Array) {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return int16;
}

/**
 * Convert Int16Array to Base64 string for WebSocket transmission.
 * @param {Int16Array} int16Array
 * @returns {string}
 */
export function int16ToBase64(int16Array) {
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Float32 audio samples to Base64-encoded 16-bit PCM.
 * @param {Float32Array} float32Array
 * @returns {string}
 */
export function audioToBase64PCM(float32Array) {
  return int16ToBase64(floatTo16BitPCM(float32Array));
}

/**
 * Downsample audio buffer to a lower sample rate.
 * @param {Float32Array} buffer
 * @param {number} inputSampleRate
 * @param {number} outputSampleRate
 * @returns {Float32Array}
 */
export function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (outputSampleRate >= inputSampleRate) {
    return buffer;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), buffer.length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += buffer[j];
    }
    result[i] = sum / (end - start);
  }

  return result;
}

/**
 * Calculate Root Mean Square volume level.
 * @param {Float32Array} buffer
 * @returns {number}
 */
export function calculateRMS(buffer) {
  if (!buffer || buffer.length === 0) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Detect voice activity based on RMS threshold.
 * @param {Float32Array} buffer
 * @param {number} [threshold=0.01]
 * @returns {boolean}
 */
export function detectVoiceActivity(buffer, threshold = 0.01) {
  return calculateRMS(buffer) > threshold;
}

/**
 * Merge multiple ArrayBuffer chunks into one.
 * @param {ArrayBuffer[]} chunks
 * @returns {ArrayBuffer}
 */
export function mergeAudioChunks(chunks) {
  if (!chunks || chunks.length === 0) {
    return new ArrayBuffer(0);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return result.buffer;
}
