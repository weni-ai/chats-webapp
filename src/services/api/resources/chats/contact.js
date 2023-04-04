import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getAllWithClosedRooms(offset, limit, contact, date, tags, sector) {
    const response = await http.get('/contact/', {
      params: {
        project: getProject(),
        offset,
        limit,
        search: contact,
        r_ended_at_after: date.start,
        r_ended_at_before: date.end,
        tag: tags,
        sector,
      },
    });
    return response.data;
  },
};
