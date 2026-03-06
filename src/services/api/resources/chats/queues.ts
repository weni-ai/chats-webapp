import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import { useProfile } from '@/store/modules/profile';

import type { QueuePermission } from './types';

interface ListQueuesResponse {
  user_permissions: QueuePermission[];
  [key: string]: any;
}

export default {
  async getListQueues(): Promise<ListQueuesResponse> {
    const profileStore = useProfile();
    const { me } = profileStore as unknown as {
      me: { email: string; [key: string]: any };
    };
    const userEmail = me.email;
    const project = getProject();
    const params = {
      user_email: userEmail,
      project: project,
    };

    const response = await http.get('/queue/list_queue_permissions/', {
      params,
    });
    return response.data;
  },

  async editListQueues(queues: QueuePermission[]): Promise<boolean> {
    const validQueues = queues.filter((permission) => permission.uuid);

    const requests = validQueues.map((permission) => {
      const uuid = permission.uuid;
      const requestBody = {
        role: permission.role,
      };

      return http.patch(
        `/authorization/queue/${uuid}/update_queue_permissions/`,
        requestBody,
      );
    });

    const responses = await Promise.all(requests);
    return responses.every((response) => response.status === 200);
  },
};
