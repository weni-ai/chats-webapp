import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getAll() {
    const response = await http.get('/room/', {
      params: { is_active: true, project: getProject() },
    });
    return response.data;
  },

  async getClosed() {
    const response = await http.get('/room/', { params: { is_active: false } });
    return response.data;
  },

  async close(uuid, tags) {
    const response = await http.put(`/room/${uuid}/close/`, { tags });
    return response.data;
  },

  async take(uuid, email) {
    const response = await http.put(`/room/${uuid}/`, { user_email: email });
    return response.data;
  },
};
