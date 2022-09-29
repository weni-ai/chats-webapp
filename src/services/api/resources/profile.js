import http from '@/services/api/http';

export default {
  async me() {
    const response = await http.get('/accounts/profile/');
    return response.data;
  },
};
