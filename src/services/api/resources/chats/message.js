import http from '@/services/api/http';
import { getProject } from '@/utils/config';

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
      response = await http.get(`${endpoint}${paramsNextReq}`);
    } else {
      response = await http.get(endpoint, { params });
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

  async sendRoomMessage(roomId, { text, user_email, seen }) {
    const response = await http.post('/msg/', {
      room: roomId,
      text,
      user_email,
      seen,
    });
    return response.data;
  },

  async sendDiscussionMessage(discussionUuid, { text }) {
    const response = await http.post(`/discussion/${discussionUuid}/send_messages/`, {
      text,
    });
    return response.data;
  },

  async sendRoomMedia(roomId, { user_email, media, updateLoadingFiles }) {
    const msg = await this.sendRoomMessage(roomId, {
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

  async sendDiscussionMedia(discussionUuid, { media, updateLoadingFiles }) {
    console.log('media', media);
    console.log('updateLoadingFiles', updateLoadingFiles);

    const mediaUuid = media.name + Date.now();

    updateLoadingFiles?.(mediaUuid, 0);
    const response = await http.postForm(
      `/discussion/${discussionUuid}/send_media_messages/`,
      {
        content_type: media.type,
        text: '',
        media_file: media,
      },
      {
        onUploadProgress: (event) => {
          const progress = event.loaded / event.total;
          updateLoadingFiles?.(mediaUuid, progress);
        },
      },
    );
    return response.data?.media?.[0];
  },
};
