import http from '@/services/api/http';
import { getProject } from '@/utils/config';

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
        project: getProject(),
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

  async sendMedia({ roomId, userEmail, media, updateLoadingFiles }) {
    const isDocument = media.type === 'application/pdf';
    const msg = await this.send(roomId, {
      text: isDocument ? media.name : '',
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
          const progress = event.loaded / event.total;
          updateLoadingFiles?.(msg.uuid, progress);
        },
      },
    );
    return response.data;
  },
  // async sendMedia({ roomId, text, userEmail, media }) {
  //   // const msg = await this.send(roomId, {
  //   //   text: media.name,
  //   //   user_email: userEmail,
  //   // });
  //   const response = await http.postForm('/msg/create_media/', {
  //     'message.room': roomId,
  //     'message.user_email': userEmail,
  //     'message.text': text,
  //     content_type: media.type,
  //     media_file: media,
  //   });
  //   console.log(response.data, 'response.data');
  //   return response.data;
  // },
};
