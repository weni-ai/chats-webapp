import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getAllWithClosedRooms(offset, limit) {
    const response = await http.get('/contact/', {
      params: {
        project: getProject(),
        ordering: 'created_on',
        offset,
        limit,
      },
    });
    return response.data;
  },
};
