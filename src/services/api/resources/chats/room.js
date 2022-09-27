import http from '@/services/api/http';

export default {
  async getAll() {
    const response = await http.get('/room/', { params: { is_active: true } });
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
};
