import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import { getURLParams } from '@/utils/requests';

export default {
  async getByRoom({ nextReq }, roomId) {
    const endpoint = '/msg/';
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });
    const params = {
      room: roomId,
      ordering: '-created_on',
      reverse_results: true,
    };

    let response;

    const config = {
      baseURL: http.defaults.baseURL.replace('/v1', '/v2'),
    };

    if (nextReq && paramsNextReq) {
      response = await http.get(`${endpoint}${paramsNextReq}`, config);
    } else {
      response = await http.get(endpoint, { params, ...config });
    }

    return response.data;
  },

  async getByDiscussion({ nextReq }, discussionUuid, offset, limit) {
    const endpoint = `discussion/${discussionUuid}/list_messages/`;
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });
    const params = {
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

  async getByContact(
    contactUuid,
    offset,
    limit,
    { onlyClosedRooms = true } = {},
  ) {
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

  async sendRoomMessage(
    roomId,
    { text, user_email, seen, repliedMessageId, aiTextImprovement, media },
  ) {
    const payload = {
      room: roomId,
      text,
      user_email,
      seen,
      replied_message_id: repliedMessageId,
    };

    if (aiTextImprovement) {
      payload.ai_text_improvement = aiTextImprovement;
    }

    if (Array.isArray(media) && media.length) {
      payload.media = media;
    }

    const response = await http.post('/msg/', payload);
    return response.data;
  },

  async sendDiscussionMessage(discussionUuid, { text }) {
    const response = await http.post(
      `/discussion/${discussionUuid}/send_messages/`,
      {
        text,
      },
    );
    return response.data;
  },

  async sendRoomMedia(
    roomId,
    { user_email, media, updateLoadingFiles, repliedMessageId, createMessage },
  ) {
    const msg = createMessage
      ? await createMessage()
      : await this.sendRoomMessage(roomId, {
          text: '',
          user_email,
          seen: true,
        });

    const messageResponse = {
      ...msg,
      media: Array.isArray(msg.media) ? [...msg.media] : [],
    };

    updateLoadingFiles?.(messageResponse.uuid, 0);
    const response = await http.postForm(
      '/media/',
      {
        content_type: media.type,
        message: messageResponse.uuid,
        media_file: media,
        replied_message_id: repliedMessageId,
      },
      {
        onUploadProgress: (event) => {
          const progress = event.loaded / event.total;
          updateLoadingFiles?.(messageResponse.uuid, progress);
        },
      },
    );

    return {
      message_response: messageResponse,
      media_response: response.data,
    };
  },

  async sendDiscussionMedia(discussionUuid, { media, updateLoadingFiles }) {
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
