import http from '@/services/api/http';

import { getProject } from '@/utils/config';

export default {
  async listAll({ offset, limit, filters }) {
    const endpoint = `/project/${getProject()}/all_agents/`;

    const params = {
      offset,
      limit,
      ...(filters || {}),
    };
    const response = await http.get(endpoint, {
      params,
    });
    return response.data;
  },

  async listRepresentativeQueuePermission({ representativeEmail }) {
    const endpoint = `/agent/queue_permissions/`;
    const params = {
      agent: representativeEmail,
      project: getProject(),
    };
    const response = await http.get(endpoint, {
      params,
    });
    return response.data;
  },

  async updateRepresentativeQueuePermission({
    representatives,
    toRemove,
    toAdd,
    chatsLimit,
  }) {
    const endpoint = `/agent/update_queue_permissions/`;
    const body = {
      agents: representatives,
      to_remove: toRemove,
      to_add: toAdd,
      chats_limit: chatsLimit
        ? {
            is_active: chatsLimit.is_active,
            total: Number(chatsLimit.total),
          }
        : undefined,
      project: getProject(),
    };
    const response = await http.post(endpoint, body);
    return response.data;
  },
};
