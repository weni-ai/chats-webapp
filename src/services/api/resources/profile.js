import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async me() {
    const response = await http.get('/accounts/profile/');
    return response.data;
  },

  async onboarded() {
    const response = await http.get('/permission/project/verify_access/', {
      params: {
        project: getProject(),
      },
    });

    const isUserFirstAccess = response.data.first_access;

    return !isUserFirstAccess;
  },

  async onboard() {
    await http.patch(`/permission/project/update_access/?project=${getProject()}`);
  },

  /**
   * {
   *  "connection_status": "offline" | "online"
   * }
   */
  status() {
    return http.get('/internal/permission/project/status/', {
      params: {
        project: getProject(),
      },
    });
  },

  /**
   * {
   *  "connection_status": "offline" | "online"
   * }
   */
  updateStatus({ projectUuid, status }) {
    return http.post('/internal/permission/project/status/', {
      project: projectUuid,
      status,
    });
  },
};
