import http from '@/services/api/http';
import axios from 'axios';
import { getProject } from '@/utils/config';

const client = axios.create();

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

  async listFromContactAndRoom({ ordering, message, contact, room, page }) {
    const response = await http.get(`/media/`, {
      params: {
        ordering,
        message,
        contact,
        room,
        page,
      },
    });
    return response.data;
  },
  async listFromContactAndClosedRoom({ ordering, message, contact, room, page }) {
    const response = await http.get(`/media/`, {
      params: {
        ordering,
        message,
        contact,
        room,
        page,
        project: getProject(),
      },
    });
    return response.data;
  },
};
