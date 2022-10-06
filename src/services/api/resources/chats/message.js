import http from '@/services/api/http';
import { getProject } from '@/utils/config';

const projectUuid = getProject();

export default {
  async getByRoom(roomId) {
    const response = await http.get(`/msg/?room=${roomId}&ordering=created_on&limit=100`);
    return response.data;
  },

  async getByContact(contactUuid, { onlyClosedRooms = true } = {}) {
    const response = await http.get('/msg/', {
      params: {
        ordering: 'created_on',
        contact: contactUuid,
        project: projectUuid,
        is_active: !onlyClosedRooms,
        limit: 100,
      },
    });
    return response.data;
  },

  async send(roomId, { text, user_email: userEmail }) {
    const response = await http.post('/msg/', {
      room: roomId,
      text,
      user_email: userEmail,
    });
    return response.data;
  },

  async sendMedia({ roomId, userEmail, media }) {
    const msg = await this.send(roomId, {
      text: media.name,
      user_email: userEmail,
    });
    const response = await http.postForm('/media/', {
      content_type: media.type,
      message: msg.uuid,
      media_file: media,
    });

    return response.data;
  },
};
