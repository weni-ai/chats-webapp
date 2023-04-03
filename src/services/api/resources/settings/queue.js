import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async create({ name, sectorUuid }) {
    const response = await http.post('/queue/', {
      name,
      sector: sectorUuid,
      project: getProject(),
    });
    return response.data;
  },

  async list(sectorUuid, offset, limit) {
    const response = await http.get('/queue/', {
      params: {
        sector: sectorUuid,
        ordering: '-created_on',
        offset,
        limit,
      },
    });
    return response.data;
  },

  async delete(queueUuid) {
    await http.delete(`/queue/${queueUuid}/`);
  },

  async agents(queueUuid, offset, limit) {
    const response = await http.get('/authorization/queue/', {
      params: {
        queue: queueUuid,
        offset,
        limit,
      },
    });
    return response.data;
  },

  async addAgent(queueUuid, agentUuid) {
    await http.post('/authorization/queue/', {
      queue: queueUuid,
      permission: agentUuid,
    });
  },

  async removeAgent(agentUuid) {
    await http.delete(`/authorization/queue/${agentUuid}`);
  },

  async tags(queueUuid, offset, limit) {
    const response = await http.get('/tag/', { params: { queue: queueUuid, offset, limit } });
    return response.data;
  },
};
