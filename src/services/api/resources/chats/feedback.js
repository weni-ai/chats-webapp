import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async createFeedback(feedback) {
    const projectUuid = getProject();
    const response = await http.post(`feedbacks/`, {
      ...feedback,
      project_uuid: projectUuid,
    });

    return response.data;
  },

  async getIsShowFeedback() {
    const projectUuid = getProject();
    const response = await http.get(`feedbacks/`, {
      params: {
        project_uuid: projectUuid,
      },
    });
    return response.data;
  },
};
