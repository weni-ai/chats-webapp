import http from '@/services/api/http';

const PROJECT_ID = '34a93b52-231e-11ed-861d-0242ac120002';

export default {
  async create({ name, sectorUuid }) {
    const response = await http.post('/queue/', { name, sector: sectorUuid, project: PROJECT_ID });
    return response.data;
  },

  async list(sectorUuid) {
    const response = await http.get('/queue/', { params: { sector: sectorUuid } });
    return response.data;
  },

  async delete(queueUuid) {
    await http.delete(`/queue/${queueUuid}/`);
  },

  async agents(queueUuid) {
    const response = await http.get('/authorization/queue/', {
      params: {
        queue: queueUuid,
      },
    });
    return response.data;
  },

  async addAgent(queueUuid, agentUuid) {
    await http.post('/authorization/queue/', {
      role: 1, // agent
      queue: queueUuid,
      permission: agentUuid,
    });
  },
  async removeAgent(agentUuid) {
    await http.delete(`/authorization/queue/${agentUuid}`);
  },
};
