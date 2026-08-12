import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getHistoryRooms({
    offset = 0,
    limit = 5,
    ended_at_before = '',
    ended_at_after = '',
    search = '',
    contact = '',
    email = '',
    document = '',
    sector = '',
    tag = '',
  }) {
    const params = {
      project: getProject(),
      offset,
      limit,
      ended_at_before,
      ended_at_after,
      sector,
      tag,
      ordering: '-ended_at',
    };

    if (search) params.search = search;
    if (contact) params.contact = contact;
    if (email) params.email = email;
    if (document) params.document = document;

    const response = await http.get(`/history/rooms/`, { params });
    return response.data;
  },

  async getHistoryContactRoomsUuids({ external_id }) {
    const response = await http.get(`/history/rooms/`, {
      params: {
        project: getProject(),
        contact: external_id,
        ordering: 'ended_at',
        basic: true,
      },
    });
    return response.data;
  },
  async getHistoryContactRoom({ room }) {
    const response = await http
      .get(`/history/rooms/${room}/`, {
        params: {
          project: getProject(),
        },
      })
      .then((response) => response.data)
      .catch((error) => error.response);

    return response;
  },

  async exportRoom({ room, types }) {
    const response = await http.post('/chats/report/room/', { room, types });
    return response.data;
  },
};
