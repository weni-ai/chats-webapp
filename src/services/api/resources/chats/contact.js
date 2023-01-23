import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getAllWithClosedRooms({ page }) {
    const response = await http.get('/contact/', {
      params: {
        project: getProject(),
        page,
      },
    });
    return response.data;
  },
};
