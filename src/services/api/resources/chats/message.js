import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import axios from 'axios';

// TODO: Remove after backend is not mocked
const httpDiscussion = axios.create({
  baseURL: `https://a89f398a-8473-4d5e-87da-e297b4c02dc9.mock.pstmn.io/v1`,
});

function getURLParams({ URL, endpoint }) {
  return URL?.split(endpoint)?.[1];
}

export default {
  async getByRoom({ nextReq }, roomId, offset, limit) {
    const endpoint = '/msg/';
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });
    const params = {
      room: roomId,
      ordering: '-created_on',
      reverse_results: true,
      offset,
      limit,
    };

    let response;

    if (nextReq && paramsNextReq) {
      response = await http.get(`${endpoint}${paramsNextReq}`);
    } else {
      response = await http.get(endpoint, { params });
    }

    return response.data;
  },

  async getByDiscussion({ nextReq }, discussionUuid, offset, limit) {
    const endpoint = `discussion/${discussionUuid}/list_messages/`;
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });
    const params = {
      offset,
      limit,
    };

    let response;

    if (nextReq && paramsNextReq) {
      response = await httpDiscussion.get(`${endpoint}${paramsNextReq}`);
    } else {
      response = await httpDiscussion.get(endpoint, { params });
    }

    return response.data;
  },

  async getByContact(contactUuid, offset, limit, { onlyClosedRooms = true } = {}) {
    const response = await http.get('/msg/', {
      params: {
        ordering: '-created_on',
        reverse_results: true,
        contact: contactUuid,
        project: getProject(),
        is_active: !onlyClosedRooms,
        offset,
        limit,
      },
    });
    return response.data;
  },

  async send(roomId, { text, user_email, seen }) {
    const response = await http.post('/msg/', {
      room: roomId,
      text,
      user_email,
      seen,
    });
    return response.data;
  },

  async sendMedia(roomId, { user_email, media, updateLoadingFiles }) {
    const msg = await this.send(roomId, {
      text: '',
      user_email,
      seen: true,
    });
    updateLoadingFiles?.(msg.uuid, 0);
    const response = await http.postForm(
      '/media/',
      {
        content_type: media.type,
        message: msg.uuid,
        media_file: media,
      },
      {
        onUploadProgress: (event) => {
          const progress = event.loaded / event.total;
          updateLoadingFiles?.(msg.uuid, progress);
        },
      },
    );
    return response.data;
  },
};
