import http from '@/services/api/http';

import { useRooms } from '@/store/modules/chats/rooms';

import { getProject } from '@/utils/config';

export default {
  async create({ queue, subject, initial_message }) {
    const roomsStore = useRooms();
    const response = await http
      .post(`discussion/`, {
        room: roomsStore.activeRoom.uuid || '',
        queue,
        subject,
        initial_message,
      })
      .then((response) => response.data)
      .catch((error) => error.response);
    return response;
  },
  async delete({ discussionUuid }) {
    const response = http.delete(`discussion/${discussionUuid}/`);
    return response.data;
  },
  async addAgent({ discussionUuid, user_email }) {
    const response = await http.post(
      `discussion/${discussionUuid}/add_agents/`,
      { user_email },
    );
    return response.data;
  },
  async getDiscussionDetails({ discussionUuid }) {
    const response = await http.get(`discussion/${discussionUuid}/`);
    return response.data;
  },
  async getDiscussionAgents({ discussionUuid }) {
    const response = await http.get(
      `discussion/${discussionUuid}/list_agents/`,
    );
    return response.data;
  },
  async getSectors() {
    const response = await http.get(
      `project/${getProject()}/list_discussion_sector/`,
      {
        limit: 9999,
      },
    );
    return response.data;
  },
  async listAll({ viewedAgent, filters = {} }) {
    const params = {
      project: getProject() || '',
      is_active: true,
      ...filters,
    };

    if (viewedAgent) {
      params.email = viewedAgent;
    }

    const response = await http.get(`discussion/`, {
      params,
    });
    return response.data;
  },
  async listCloseds({ roomId }) {
    const response = await http.get(`discussion/`, {
      params: {
        project: getProject() || '',
        room: roomId,
      },
    });
    return response.data;
  },
};
