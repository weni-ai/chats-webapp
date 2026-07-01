import http from '@/services/api/http';
import axios from 'axios';
import { getProject } from '@/utils/config';
import { normalizeS3MediaUrl } from '@/utils/medias';

const client = axios.create();

/**
 * @param {string|null|undefined} header
 * @returns {string|null}
 */
export function getFilenameFromContentDisposition(header) {
  if (!header) return null;
  const match = header.match(/filename="([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
function triggerBrowserDownload(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Extracts cursor from pagination URL
 * @param {string|null} url - The pagination URL
 * @returns {string|null} The cursor value or null
 */
const extractCursor = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('cursor');
  } catch {
    return null;
  }
};

export default {
  /**
   *
   * @param {string} url
   * @returns {Promise<Blob>}
   */
  async get(url) {
    const response = await client.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  async download({ messageUuid, mediaUuid, media, name }) {
    if (messageUuid) {
      const response = await http.get(`/msg/${messageUuid}/download/`, {
        responseType: 'blob',
      });
      const filename =
        getFilenameFromContentDisposition(
          response.headers['content-disposition'],
        ) || `${messageUuid}.mp3`;
      triggerBrowserDownload(response.data, filename);
      return;
    }

    if (mediaUuid) {
      const response = await http.get(`/media/${mediaUuid}/download/`, {
        responseType: 'blob',
      });
      const filename =
        getFilenameFromContentDisposition(
          response.headers['content-disposition'],
        ) || `${mediaUuid}.mp3`;
      triggerBrowserDownload(response.data, filename);
      return;
    }

    const url = normalizeS3MediaUrl(media);
    const file = await this.get(url);
    triggerBrowserDownload(file, name);
  },

  async listFromContactAndRoom({
    ordering,
    message,
    contact,
    room,
    page_size,
    cursor,
    content_type,
  }) {
    const response = await http.get(`/media/`, {
      params: {
        ordering,
        message,
        contact,
        room,
        page_size,
        cursor,
        content_type,
      },
    });
    return {
      results: response.data.results,
      next: response.data.next,
      previous: response.data.previous,
      nextCursor: extractCursor(response.data.next),
      previousCursor: extractCursor(response.data.previous),
    };
  },
  async listFromContactAndClosedRoom({
    ordering,
    message,
    contact,
    room,
    page_size,
    cursor,
    content_type,
  }) {
    const response = await http.get(`/media/`, {
      params: {
        ordering,
        message,
        contact,
        room,
        page_size,
        cursor,
        content_type,
        project: getProject(),
      },
    });
    return {
      results: response.data.results,
      next: response.data.next,
      previous: response.data.previous,
      nextCursor: extractCursor(response.data.next),
      previousCursor: extractCursor(response.data.previous),
    };
  },
  extractCursor,
};
