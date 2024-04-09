import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import Profile from '@/store/modules/profile';

export default {
  async getAll(offset, limit, contact, order, viewedAgent) {
    const params = {
      is_active: true,
      project: getProject(),
      offset,
      limit,
      ordering: `user,${order}`,
      search: contact,
    };

    if (viewedAgent) {
      params.email = viewedAgent;
    }

    const response = await http.get('/room/', {
      params,
    });
    return response.data;
  },

  async getByUuid({ uuid }) {
    if (uuid) {
      const response = await http.get(`/room/${uuid}/`);
      return response.data;
    }

    return console.error('"Uuid" necessário para requisição.');
  },

  async getCanUseCopilot({ uuid }) {
    if (uuid) {
      const response = await http.get(`/room/${uuid}/chat_completion/`);
      return response.data;
    }

    return console.error('"Uuid" necessário para requisição.');
  },

  async getCopilotSuggestion({ uuid }) {
    if (uuid) {
      const response = await http
        .post(`/room/${uuid}/chat_completion/`)
        .then((response) => response.data)
        .catch((error) => error.response);
      return response;
    }

    return console.error('"Uuid" necessário para requisição.');
  },

  async getClosed() {
    const response = await http.get('/room/', { params: { is_active: false } });
    return response.data;
  },

  async close(uuid, tags) {
    const response = await http.put(`/room/${uuid}/close/`, { tags });
    return response.data;
  },
  async updateReadMessages(uuid, read) {
    await http.patch(`/room/${uuid}/bulk_update_msgs/`, {
      seen: read,
    });
  },

  async take(uuid, email, queueUuid) {
    const response = await http.put(
      `/room/${uuid}/`,
      email ? { user_email: email } : { queue_uuid: queueUuid },
    );
    return response.data;
  },

  async getQueueRoom(uuid) {
    const { me } = Profile.state;
    const response = await http.patch(
      `/room/${uuid}/pick_queue_room/?user_email=${me?.email}`,
    );
    return response.data;
  },

  async updateCustomFields(uuid, customFields = {}) {
    const response = await http.patch(
      `/room/${uuid}/update_custom_fields/`,
      customFields,
    );
    return response.data;
  },

  async getListQueues() {
    const { me } = Profile.state;
    const userEmail = me.email;
    const project = getProject();

    console.log(Profile.state);
    console.log(Profile.state.me);
    console.log(Profile.state.me.email);

    const params = {
      user_email: userEmail || 'teste',
      project: project,
    };

    const response = await http.get('/queue/list_queue_permissions/', {
      params,
    });
    return response.data;
  },

  async editListQueues({ queue, permission }) {
    const queuesData = await this.getListQueues();
    const uuid = queuesData.user_permissions[0].uuid;

    const userPermissions = {
      queueUuid: queue,
      queuePermission: permission,
    };

    const response = await http.patch(
      `/authorization/queue/${uuid}/`,
      userPermissions,
    );
    return response.data;
  },
};
