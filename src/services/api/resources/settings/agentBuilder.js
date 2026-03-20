import http from '@/services/api/http';
import { getProject } from '@/utils/config';

function getEndpoint() {
  return `/human-support/${getProject()}/`;
}

export default {
  async getAiTransferConfig() {
    const response = await http.get(getEndpoint());
    const { human_support, human_support_prompt } = response.data;
    return {
      enabled: human_support,
      criteria: human_support_prompt || '',
    };
  },

  async updateAiTransferConfig({ enabled, criteria }) {
    const body = {};
    if (enabled !== undefined) body.human_support = enabled;
    if (criteria !== undefined) body.human_support_prompt = criteria;

    const response = await http.patch(getEndpoint(), body);
    return response.data;
  },
};
