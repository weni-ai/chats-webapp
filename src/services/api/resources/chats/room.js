import http from '@/services/api/http';

import { getProject } from '@/utils/config';

import { useProfile } from '@/store/modules/profile';

import { asyncTimeout } from '@/utils/time';

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

  async getSummary({ roomUuid }) {
    const url = `/room/${roomUuid}/chats-summary`;
    // const response = await http.get(url);
    const response = {
      data: {
        status: 'DONE',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In nulla ex, mollis eget magna in, lacinia hendrerit erat. Aliquam erat volutpat. Nulla quis dui felis. Integer pulvinar neque sit amet suscipit efficitur. Sed accumsan metus a feugiat mattis. Nunc pellentesque massa in lorem pulvinar maximus. Morbi tempor imperdiet nisl, ut cursus risus leo.',
      },
    };

    await asyncTimeout(3000);

    return response.data;
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
    const profileStore = useProfile();
    const { me } = profileStore;
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

  async bulkTranfer({ rooms = [], intended_agent = '', intended_queue = '' }) {
    const profileStore = useProfile();
    const { email: user_email } = profileStore.me;
    const body = { rooms_list: rooms };
    const params = {
      user_request: user_email,
      ...(intended_agent
        ? { user_email: intended_agent }
        : { queue_uuid: intended_queue }),
    };

    const response = await http
      .patch(`room/bulk_transfer/`, body, { params })
      .then((response) => response)
      .catch((error) => error.response);
    return response;
  },
};
