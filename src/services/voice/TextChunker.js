/**
 * Sentence-boundary text batching for TTS credit efficiency.
 *
 * Accumulate streaming text and emit chunks at sentence boundaries,
 * keeping each chunk within configurable size limits.
 *
 * @module TextChunker
 */

const SENTENCE_DELIMITERS = /[.!?。！？\n]/;

const DEFAULT_MIN_CHUNK_SIZE = 20;
const DEFAULT_MAX_CHUNK_SIZE = 150;

/**
 * Find the index of the last sentence delimiter in a string.
 *
 * @param {string} text
 * @returns {number} Index of last delimiter, or -1 if none found.
 */
function lastDelimiterIndex(text) {
  for (let i = text.length - 1; i >= 0; i--) {
    if (SENTENCE_DELIMITERS.test(text[i])) {
      return i;
    }
  }
  return -1;
}

/**
 * Find the index of the last space in a string.
 *
 * @param {string} text
 * @returns {number} Index of last space, or -1 if none found.
 */
function lastSpaceIndex(text) {
  return text.lastIndexOf(' ');
}

class TextChunker {
  /**
   * Create a TextChunker instance.
   *
   * @param {object} [options]
   * @param {number} [options.minChunkSize=20] Minimum buffer length before
   *   emitting at a sentence boundary.
   * @param {number} [options.maxChunkSize=150] Force-split threshold when no
   *   sentence delimiter is present.
   */
  constructor(options = {}) {
    const {
      minChunkSize = DEFAULT_MIN_CHUNK_SIZE,
      maxChunkSize = DEFAULT_MAX_CHUNK_SIZE,
    } = options;

    /** @type {number} */
    this._minChunkSize = minChunkSize;

    /** @type {number} */
    this._maxChunkSize = maxChunkSize;

    /** @type {string} */
    this._buffer = '';
  }

  /**
   * Append text to the internal buffer and attempt to emit a chunk.
   *
   * Return a trimmed chunk when the buffer contains a sentence delimiter
   * and meets the minimum size, or when the buffer exceeds the maximum
   * size (splitting at a word boundary). Return null when more text is
   * needed.
   *
   * @param {string} text - Incoming text fragment.
   * @returns {string|null} Emitted chunk or null.
   */
  addText(text) {
    if (typeof text !== 'string' || text.length === 0) {
      return null;
    }

    this._buffer += text;

    const delimIdx = lastDelimiterIndex(this._buffer);

    if (delimIdx !== -1 && this._buffer.length >= this._minChunkSize) {
      const chunk = this._buffer.slice(0, delimIdx + 1).trim();
      this._buffer = this._buffer.slice(delimIdx + 1);
      return chunk.length > 0 ? chunk : null;
    }

    if (this._buffer.length >= this._maxChunkSize) {
      const spaceIdx = lastSpaceIndex(this._buffer);
      if (spaceIdx > 0) {
        const chunk = this._buffer.slice(0, spaceIdx).trim();
        this._buffer = this._buffer.slice(spaceIdx + 1);
        return chunk.length > 0 ? chunk : null;
      }
    }

    return null;
  }

  /**
   * Emit all remaining buffered text.
   *
   * @returns {string|null} Remaining text or null if buffer is empty.
   */
  flush() {
    const chunk = this._buffer.trim();
    this._buffer = '';
    return chunk.length > 0 ? chunk : null;
  }

  /**
   * Discard the buffer immediately (e.g. on barge-in).
   */
  clear() {
    this._buffer = '';
  }

  /**
   * Return the current buffer length.
   *
   * @returns {number}
   */
  getBufferLength() {
    return this._buffer.length;
  }
}

export { TextChunker };
export default TextChunker;
