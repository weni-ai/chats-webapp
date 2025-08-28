import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export default {
  async getAllFeatureFlags() {
    const projectUuid = getProject();

    const endpoint = '/feature_flags/';

    const response = await http.get(endpoint, {
      params: {
        project_uuid: projectUuid,
      },
    });

    return response.data;
  },
};
