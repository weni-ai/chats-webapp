import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getAllWithClosedRooms() {
    const response = await http.get('/contact/', {
      params: {
        project: getProject(),
      },
    });
    return response.data;
  },
};
