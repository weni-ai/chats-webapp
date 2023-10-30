import axios from 'axios';
import Rooms from '@/store/modules/chats/rooms';

import { getProject } from '@/utils/config';

const http = axios.create({
  baseURL: `https://a89f398a-8473-4d5e-87da-e297b4c02dc9.mock.pstmn.io/v1`,
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
  async addAgent({ discussionUuid, user_email }) {
    const response = await http.post(`discussion/${discussionUuid}`, { user_email });
    return response.data;
  },
  async getDiscussionDetails({ discussionUuid }) {
    const response = await http.get(`discussion/${discussionUuid}`);
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
