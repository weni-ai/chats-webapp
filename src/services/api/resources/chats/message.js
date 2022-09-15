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

  async sendFile({ roomId, userEmail, file }) {
    const msg = await this.send(roomId, {
      text: file.name,
      user_email: userEmail,
    });
    const media = await http.postForm('/media/', {
      content_type: file.type,
      message: msg.uuid,
      media_file: file,
    });

    return media.data;
  },

  async sendAudio({ roomId, userEmail, audio }) {
    const msg = await this.send(roomId, {
      text: audio.name,
      user_email: userEmail,
    });
    const media = await http.postForm('/media/', {
      content_type: audio.type,
      message: msg.uuid,
      media_file: audio,
    });

    return media.data;
  },
};
