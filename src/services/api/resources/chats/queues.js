import http from '@/services/api/http';

import { getProject } from '@/utils/config';

import { useProfile } from '@/store/modules/profile';
import { useDashboard } from '@/store/modules/dashboard';

export default {
  async getListQueues() {
    const profileStore = useProfile();
    const { me } = profileStore;
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

  async editListQueues(queues) {
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

  async getQueuesToFilter() {
    const dashboardStore = useDashboard();

    const url = '/rooms_count/by_queue/';
    const params = {
      project: getProject(),
      email: dashboardStore.viewedAgent?.email || undefined,
    };
    const response = await http.get(url, { params });
    return response.data;
  },
};
