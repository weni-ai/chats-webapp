import http from '@/services/api/http';

import { getProject } from '@/utils/config';

import { useProfile } from '@/store/modules/profile';

import { getURLParams } from '@/utils/requests';

import i18n from '@/plugins/i18n';

export default {
  async getAll(offset, limit, contact, order, viewedAgent, roomsType) {
    const params = {
      is_active: true,
      project: getProject(),
      offset,
      limit,
      ordering: order,
      search: contact,
      room_status: roomsType,
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

  async getSummaryFeedbackTags() {
    const response = await http.get(
      '/ai_features/history_summary/feedback/tags/',
      {
        headers: {
          'Accept-Language': i18n.global.locale,
        },
      },
    );
    return response.data;
  },

  async sendSummaryFeedback({ roomUuid, liked, text, tags }) {
    const response = await http.post(
      `/room/${roomUuid}/chats-summary/feedback/`,
      { liked, text, tags },
    );
    return response.data;
  },

  async getSummary({ roomUuid }) {
    const url = `/room/${roomUuid}/chats-summary/`;
    const response = await http.get(url);

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

  async close(uuid) {
    const response = await http.put(`/room/${uuid}/close/`);
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

  async getRoomTags(roomUuid, { limit = 20, next = '' }) {
    const nextParams = next
      ? getURLParams({ URL: next, endpoint: '/tag/', returnObject: true })
      : {};
    const params = { ...nextParams, limit: nextParams.limit || limit };
    const response = await http.get(`/room/${roomUuid}/tags/`, { params });
    return response.data;
  },

  async addRoomTag(roomUuid, tagUuid) {
    const response = await http.post(`/room/${roomUuid}/tags/add/`, {
      uuid: tagUuid,
    });
    return response;
  },

  async removeRoomTag(roomUuid, tagUuid) {
    const response = await http.post(`/room/${roomUuid}/tags/remove/`, {
      uuid: tagUuid,
    });
    return response;
  },

  async bulkTranfer({ rooms = [], intended_agent = '', intended_queue = '' }) {
    const profileStore = useProfile();
    const { email: user_email } = profileStore.me;
    const body = { rooms_list: rooms };
    const params = {
      user_request: user_email,
      user_email: intended_agent,
      queue_uuid: intended_queue,
    };

    const response = await http
      .patch(`room/bulk_transfer/`, body, { params })
      .then((response) => response)
      .catch((error) => error.response);
    return response;
  },

  async bulkClose({ rooms = [], end_by = 'system', closed_by_email = '' }) {
    const profileStore = useProfile();
    const { email: user_email } = profileStore.me;

    const body = {
      rooms,
      end_by: end_by || 'system',
      closed_by_email: closed_by_email || user_email,
    };

    const response = await http
      .post(`/room/bulk_close/`, body)
      .then((response) => response)
      .catch((error) => error.response);
    return response;
  },

  async pinRoom({ uuid, status = true }) {
    const response = await http.post(`/room/${uuid}/pin/`, {
      status,
    });

    return response.data;
  },

  /**
   * @description Get the can send message status of the room
   * @param {string} uuid - The uuid of the room
   * @returns {Promise<{can_send_message: boolean}>} - The can send message status
   */

  async getCanSendMessageStatus(uuid) {
    const response = await http.get(`/room/${uuid}/can-send-message-status/`);

    return response.data;
  },
};
