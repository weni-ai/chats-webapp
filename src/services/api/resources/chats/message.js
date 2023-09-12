import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getByRoom(roomId, offset, limit) {
    const response = await http.get(`/msg/?room=${roomId}`, {
      params: {
        ordering: '-created_on',
        reverse_results: true,
        offset,
        limit,
      },
    });
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

  async send(roomId, { text, user_email: userEmail, seen }) {
    const response = await http.post('/msg/', {
      room: roomId,
      text,
      user_email: userEmail,
      seen,
    });
    return response.data;
  },

  async sendMedia({ roomId, userEmail, media, updateLoadingFiles }) {
    const msg = await this.send(roomId, {
      text: '',
      user_email: userEmail,
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
          // const progress = parseInt(Math.round((event.loaded * 100) / event.total), 10);
          const progress = event.loaded / event.total;
          updateLoadingFiles?.(msg.uuid, progress);
        },
      },
    );
    return response.data;
  },
};
