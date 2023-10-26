import axios from 'axios';
import Rooms from '@/store/modules/rooms';

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
};
