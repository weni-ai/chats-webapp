import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getRoomInfo() {
    const response = await http.get('/dashboard/rooms_info/', {
      params: {
        // project: getProject(),
        project: '3c884548-a9d5-4ea1-bc56-4d1a60e9024f',
      },
    });
    return response.data;
  },
  async getAgentInfo() {
    const response = await http.get('/dashboard/agents_info/', {
      params: {
        project: getProject(),
        // project: '3c884548-a9d5-4ea1-bc56-4d1a60e9024f',
      },
    });
    return response.data;
  },
};
