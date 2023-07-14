import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getAll({ limit, contact, order, viewedAgent, nextRooms }) {
    const params = {
      is_active: true,
      project: getProject(),
      limit,
      ordering: `user,${order}`,
      search: contact,
    };

    if (viewedAgent) {
      params.email = viewedAgent;
    }

    const nextRoomsStringParams = nextRooms?.split('/room/')?.[1];
    const url = nextRooms ? `/room/${nextRoomsStringParams}` : '/room/';
    const config = nextRooms ? {} : { params };

    const response = await http.get(url, config);
    return response.data;
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
    const response = await http.patch(`/room/${uuid}/bulk_update_msgs/`, {
      seen: read,
    });
    return response.data;
  },

  async take(uuid, email, queueUuid) {
    const response = await http.put(
      `/room/${uuid}/`,
      email ? { user_email: email } : { queue_uuid: queueUuid },
    );
    return response.data;
  },
};
