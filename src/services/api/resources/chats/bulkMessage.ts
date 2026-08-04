import http from '@/services/api/http';
import { getProject } from '@/utils/config';

interface CountRoomsParams {
  agents?: string[];
  queues?: string[];
  status?: string[];
}

export default {
  async countRooms({
    agents,
    queues,
    status,
  }: CountRoomsParams): Promise<{ count: number }> {
    const endpoint = '/msg/bulk-send/rooms/';

    const params = {
      project: getProject(),
      agents: agents?.includes('all') ? undefined : agents?.join(','),
      queues: queues?.includes('all') ? undefined : queues?.join(','),
      status: status?.join(','),
    };

    const response = await http.get(endpoint, { params });

    return response.data;
  },
};
