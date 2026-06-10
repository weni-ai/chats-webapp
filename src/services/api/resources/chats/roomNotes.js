import http from '@/services/api/http';

export default {
  async getInternalNotes({ room, limit } = { limit: 9999 }) {
    const response = await http.get('/room_notes/', {
      params: { room, limit },
    });

    return response.data;
  },
  async createInternalNote({ text, room }) {
    const response = await http.post(`/room/${room}/room_note/`, {
      text,
    });

    return response.data;
  },
  async sendInternalNoteMedia({ note, media }) {
    const url = `/room_note_media/`;
    const bodyData = { note, media_file: media, content_type: media.type };
    const response = await http.postForm(url, bodyData);

    return response.data;
  },
  async deleteInternalNote({ note }) {
    const response = await http.delete(`/room_notes/${note}/`);

    return response;
  },
};
