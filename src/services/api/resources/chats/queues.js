import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import Profile from '@/store/modules/profile';

export default {
  async getListQueues() {
    const { me } = Profile.state;
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
};
