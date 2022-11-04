import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export const Permissions = Object.freeze({
  Admin: 1,
  Agent: 2,
  Manager: 3,
});

export default {
  async admins() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        role: Permissions.Admin,
      },
    });
    return response.data;
  },

  async managers() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        role: Permissions.Manager,
      },
    });
    return response.data;
  },

  async agents() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        role: Permissions.Agent,
      },
    });
    return response.data;
  },
};
