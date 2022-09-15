import http from '@/services/api/http';

export default {
  async getByRoomId(roomId) {
    const response = await http.get(`/msg/?room=${roomId}&ordering=created_on&limit=100`);
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
