import axios from 'axios';
import Rooms from '@/store/modules/chats/rooms';

import { getProject } from '@/utils/config';

// TODO: Remove after backend is not mocked
const http = axios.create({
  baseURL: `https://3ca2c5f1-68af-4a4c-9c8d-88af26b086e2.mock.pstmn.io/v1`,
});

export default {
  async create({ queue, subject, initial_message }) {
    const response = await http.post(`discussion/`, {
      params: {
        room: Rooms.state.activeRoom.uuid || '',
        queue,
        subject,
        initial_message,
      },
    });
    return response.data;
  },
  async delete({ discussionUuid }) {
    const response = http.delete(`discussion/${discussionUuid}`);
    return response.data;
  },
  async addAgent({ discussionUuid, user_email }) {
    const response = await http.post(`discussion/${discussionUuid}`, { user_email });
    return response.data;
  },
  async getDiscussionDetails({ discussionUuid }) {
    const response = await http.get(`discussion/${discussionUuid}`);
    return response.data;
  },
  async getDiscussionAgents({ discussionUuid }) {
    const response = await http.get(`discussion/${discussionUuid}/list_agents`);
    return response.data;
  },
  async listAll() {
    const response = await http.get(`discussion/`, {
      params: {
        project: getProject() || '',
        is_active: true,
      },
    });
    return response.data;
  },
};
