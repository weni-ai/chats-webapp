import http from '@/services/api/http';
import { getProject } from '@/utils/config';

const uuid = getProject();

export default {
  async getListOfContacts() {
    const response = await http.get(`/project/${uuid}/list_contacts/`, {});
    return response.data;
  },

  async getListOfGroups() {
    const response = await http.get(`/project/${uuid}/list_groups/`);
    return response.data;
  },

  async getFlows() {
    const response = await http.get(`/project/${uuid}/list_flows`);
    return response.data;
  },

  async getTemplateFlow(uuidFlow) {
    const response = await http.get(`/project/${uuid}/retrieve_flow_definitions/`, {
      params: {
        flow_uuid: uuidFlow,
      },
    });
    return response.data;
  },

  async getCanTriggerFlows() {
    const response = await http.get(`/project/${uuid}/can_trigger_flows`);
    return response.data;
  },

  async createContact(contact) {
    const response = await http.post(`/project/${uuid}/create_contacts/`, contact);
    return response.data;
  },
};
