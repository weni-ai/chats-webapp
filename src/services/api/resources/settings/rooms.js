import http from '@/services/api/http';

export default {
  async count({ sector, queue } = {}) {
    const params = {};
    if (sector) params.sector = sector;
    if (queue) params.queue = queue;

    const response = await http.get('/rooms_count/', { params });
    return response.data;
  },
};
