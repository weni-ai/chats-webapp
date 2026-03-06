import http from '@/services/api/http';

import type { AxiosResponse, PaginatedResponse, InternalNote } from './types';

interface GetInternalNotesParams {
  room?: string;
  limit?: number;
}

export default {
  async getInternalNotes({
    room,
    limit = 9999,
  }: GetInternalNotesParams = {}): Promise<PaginatedResponse<InternalNote>> {
    const response = await http.get('/room_notes/', {
      params: { room, limit },
    });

    return response.data;
  },

  async createInternalNote({
    text,
    room,
  }: {
    text: string;
    room: string;
  }): Promise<InternalNote> {
    const response = await http.post(`/room/${room}/room_note/`, {
      text,
    });

    return response.data;
  },

  async deleteInternalNote({ note }: { note: string }): Promise<AxiosResponse> {
    const response = await http.delete(`/room_notes/${note}/`);

    return response;
  },
};
