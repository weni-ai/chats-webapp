import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getHistoryRooms({ offset, limit = 5 }) {
    const response = await http.get(`/history/rooms`, {
      params: {
        ended_at_before: '',
        ended_at_after: '',
        tag: '',
        project: getProject(),
        ordering: '-ended_at',
        search: '',
        offset,
        limit,
      },
    });
    console.log('response', response);
    return response.data;
  },
  async getHistoryContactRoomsUuids({ contact }) {
    const response = await http.get(`/history/rooms`, {
      params: {
        project: getProject(),
        contact,
        ordering: 'ended_at',
        basic: true,
      },
    });
    return response.data;
  },
  async getHistoryContactRoom({ room }) {
    const response = await http.get(`/history/rooms/${room}/`, {
      params: {
        project: getProject(),
      },
    });
    return response.data;
  },
};
