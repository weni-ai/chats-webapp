import http from '@/services/api/http';

import { getProject } from '@/utils/config';
import { asyncTimeout } from '@/utils/time';

import { useProfile } from '@/store/modules/profile';

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
    // TODO: Remove Mock
    await asyncTimeout(1000);
    return {
      sectors: [
        {
          name: 'SAC',
          queues: [
            {
              uuid: 'uuid1',
              name: 'Fila 1',
              rooms_in_awaiting: 20,
              rooms_in_progress: 0,
            },
            {
              uuid: 'uuid2',
              name: 'Fila 2',
              rooms_in_awaiting: 20,
              rooms_in_progress: 0,
            },
            {
              uuid: 'uuid3',
              name: 'Fila 3',
              rooms_in_awaiting: 0,
              rooms_in_progress: 0,
            },
          ],
        },
        {
          name: 'Vendas',
          queues: [
            {
              uuid: 'uuid4',
              name: 'Fila 1',
              rooms_in_awaiting: 20,
              rooms_in_progress: 0,
            },
            {
              uuid: 'uuid5',
              name: 'Fila 2',
              rooms_in_awaiting: 20,
              rooms_in_progress: 0,
            },
            {
              uuid: 'uuid6',
              name: 'Fila 3',
              rooms_in_awaiting: 0,
              rooms_in_progress: 0,
            },
          ],
        },
      ],
    };
    const url = '';
    const response = await http.get(url);
    return response.data;
  },
};
