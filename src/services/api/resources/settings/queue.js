import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import { getURLParams } from '@/utils/requests';

export default {
  async create({ name, sectorUuid, default_message, queue_limit }) {
    const response = await http.post('/queue/', {
      name,
      sector: sectorUuid,
      default_message,
      project: getProject(),
      queue_limit,
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

  async listByProject() {
    const response = await http.get('/queue/', {
      params: {
        project: getProject(),
        ordering: '-created_on',
        limit: 1000,
      },
    });
    return response.data;
  },

  async delete(queueUuid) {
    await http.delete(`/queue/${queueUuid}/`);
  },

  async agentsToTransfer(queueUuid) {
    const response = await http.get(`queue/${queueUuid}/transfer_agents/`);
    return response.data;
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
    return http.post('/authorization/queue/', {
      queue: queueUuid,
      permission: agentUuid,
    });
  },

  async removeAgent(agentUuid) {
    await http.delete(`/authorization/queue/${agentUuid}/`);
  },

  async editQueue(queueInfo) {
    const response = await http.patch(`/queue/${queueInfo.uuid}/`, {
      default_message: queueInfo.default_message,
      queue_limit: queueInfo.queue_limit,
    });
    return response;
  },

  async getQueueInformation(queueUuid) {
    const response = await http.get(`/queue/${queueUuid}/`);
    return {
      ...(response.data || {}),
      default_message: response.data?.default_message || '',
    };
  },

  async tags(queueUuid, { limit = 20, next = '' }) {
    const endpoint = '/tag/';
    const nextParams = next
      ? getURLParams({ URL: next, endpoint, returnObject: true })
      : {};
    const params = {
      ...nextParams,
      limit: nextParams.limit || limit,
      queue: queueUuid,
    };
    const response = await http.get(endpoint, {
      params,
    });
    return response.data;
  },
};
