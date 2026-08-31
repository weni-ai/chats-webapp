/**
 * Strip markup, URLs, and non-speech artifacts from text
 * so that TTS engines produce natural, fluent audio.
 *
 * Applied after TextChunker assembles complete sentences and before
 * the text reaches TTSPlayer.speak().
 *
 * @module sanitizeForTTS
 */

const FENCED_CODE_BLOCK = /```[\s\S]*?```/g;
const MARKDOWN_IMAGE = /!\[([^\]]*)\]\([^)]*\)/g;
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;
const URL_PATTERN = /https?:\/\/[^\s)}\]]+/gi;
const HAS_SPEAKABLE_CONTENT = /[\p{L}\p{N}]/u;
const HTML_TAG = /<[^>]+>/g;
const HEADING_PREFIX = /^#{1,6}\s+/gm;
const BULLET_PREFIX = /^\s*[-*+]\s+/gm;
const BOLD_ITALIC = /(\*{1,3}|_{1,3})(.+?)\1/g;
const INLINE_CODE = /`([^`]+)`/g;
const MULTIPLE_WHITESPACE = /\s{2,}/g;

/**
 * Remove non-speech content from text intended for TTS synthesis.
 *
 * @param {string} text - Raw text potentially containing markdown, URLs, etc.
 * @returns {string} Cleaned text safe for TTS, or empty string.
 */
function sanitizeForTTS(text) {
  if (typeof text !== 'string' || text.length === 0) return '';

  let result = text;

  result = result.replace(FENCED_CODE_BLOCK, '');
  result = result.replace(HTML_TAG, '');
  result = result.replace(MARKDOWN_IMAGE, '');
  result = result.replace(MARKDOWN_LINK, '$1');
  result = result.replace(URL_PATTERN, 'link');
  result = result.replace(HEADING_PREFIX, '');
  result = result.replace(BULLET_PREFIX, '');
  result = result.replace(BOLD_ITALIC, '$2');
  result = result.replace(BOLD_ITALIC, '$2');
  result = result.replace(INLINE_CODE, '$1');
  result = result.replace(/\n/g, ' ');
  result = result.replace(MULTIPLE_WHITESPACE, ' ');

  result = result.trim();

  if (!HAS_SPEAKABLE_CONTENT.test(result)) return '';

  return result;
}

export { sanitizeForTTS };
export default sanitizeForTTS;
