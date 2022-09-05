import http from '@/services/api/http';

const PROJECT_ID = '34a93b52-231e-11ed-861d-0242ac120002';

export const Permissions = Object.freeze({
  Admin: 1,
  Agent: 2,
  Manager: 3,
});

export default {
  async managers() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: PROJECT_ID,
        role: Permissions.Manager,
      },
    });
    return response.data;
  },

  async agents() {
    const response = await http.get(`/permission/project/`, {
      params: {
        project: PROJECT_ID,
        role: Permissions.Agent,
      },
    });
    return response.data;
  },
};
