import http from '@/services/api/http';
import { getProject } from '@/utils/config';

const projectUuid = getProject();

export default {
  async getAllWithClosedRooms() {
    const response = await http.get('/contact/', {
      params: {
        project: projectUuid,
      },
    });
    return response.data;
  },
};
