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

  async send(roomId, { text, user_email: userEmail }) {
    const response = await http.post('/msg/', {
      room: roomId,
      text,
      user_email: userEmail,
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
