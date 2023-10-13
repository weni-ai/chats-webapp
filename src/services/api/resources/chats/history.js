import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  // async getAllWithClosedRooms(offset, limit, contact, date, tags, sector) {
  //   const response = await http.get('/contact/', {
  //     params: {
  //       project: getProject(),
  //       offset,
  //       limit,
  //       search: contact,
  //       r_ended_at_after: date.start,
  //       r_ended_at_before: date.end,
  //       tag: tags,
  //       sector,
  //     },
  //   });
  //   return response.data;
  // },
  // async getUnicContactClosedRooms(contact) {
  //   const response = await http.get(`/contact/${contact}`, {
  //     params: {
  //       project: getProject(),
  //     },
  //   });
  //   return response.data;
  // },
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
    const response = await http.get(`/history/rooms/${room}/`, {
      params: {
        project: getProject(),
      },
    });
    return response.data;
  },
};
