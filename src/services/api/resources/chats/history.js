import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getHistoryRooms({
    offset = 0,
    limit = 5,
    ended_at_before = '',
    ended_at_after = '',
    search = '',
    sector = '',
    tag = '',
  }) {
    const response = await http.get(`/history/rooms/`, {
      params: {
        project: getProject(),
        offset,
        limit,
        ended_at_before,
        ended_at_after,
        sector,
        search,
        tag,
        ordering: '-ended_at',
      },
    });
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
};
