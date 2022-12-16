import http from '@/services/api/http';
import { getProject } from '@/utils/config';

const uuid = getProject();

export default {
  async getListOfContacts() {
    const temp = '050c0cab-4c1d-48f1-83f1-8fba08aea5fb';
    const response = await http.get(`/project/${temp}/list_contacts/`, {});
    return response.data;
  },

  async getListOfGroups() {
    const temp = '050c0cab-4c1d-48f1-83f1-8fba08aea5fb';
    const response = await http.get(`/project/${temp}/list_groups/`);
    return response.data;
  },

  async getFlows() {
    const temp = '050c0cab-4c1d-48f1-83f1-8fba08aea5fb';
    const response = await http.get(`/project/${temp}/list_flows`);
    return response.data;
  },

  async getCanTriggerFlows() {
    const response = await http.get(`/project/${uuid}/can_trigger_flows`);
    return response.data;
  },
};
