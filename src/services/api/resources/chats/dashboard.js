import http from '@/services/api/http';

export default {
  async getViewedAgentData(agentEmail) {
    const response = await http.get('/accounts/userdata/', { params: { user_email: agentEmail } });
    return response.data;
  },
};
