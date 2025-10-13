import http from '@/services/api/http';
import axios from 'axios';
import { getProject } from '@/utils/config';

const client = axios.create();

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

  async download({ media, name }) {
    const file = await this.get(media);
    const link = document.createElement('a');

    link.href = URL.createObjectURL(file);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
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
