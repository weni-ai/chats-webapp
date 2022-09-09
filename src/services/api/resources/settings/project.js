import http from '@/services/api/http';
import { getProject } from '@/utils/config';

const projectUuid = getProject();

export const Permissions = Object.freeze({
  Admin: 1,
  Agent: 2,
  Manager: 3,
});

export default {
  async managers() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: projectUuid,
        role: Permissions.Manager,
      },
    });
    return response.data;
  },

  async agents() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: projectUuid,
        role: Permissions.Agent,
      },
    });
    return response.data;
  },
};
