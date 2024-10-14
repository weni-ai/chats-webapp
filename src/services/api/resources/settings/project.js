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
        // role: Permissions.Admin,
        limit: 9999,
      },
    });
    return response.data;
  },

  async managers(offset, limit = 20) {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        offset,
        // role: Permissions.Manager,
        limit,
      },
    });
    return response.data;
  },

  async agents() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: getProject(),
        // role: Permissions.Agent,
        limit: 9999,
      },
    });
    return response.data;
  },

  async allUsers() {
    const response = await http.get(`/project/${getProject()}/list_users`, {
      params: {
        limit: 9999,
      },
    });
    return response.data;
  },

  async getInfo() {
    const projectUuid = getProject();
    const response = await http.get(`/project/${projectUuid}/`);
    return response;
  },

  async update(data) {
    const projectUuid = getProject();
    const body = {
      config: JSON.stringify(data),
    };

    const response = await http
      .patch(`/project/${projectUuid}/`, body)
      .then((response) => response.data)
      .catch((error) => error.response);
    return response;
  },
};
