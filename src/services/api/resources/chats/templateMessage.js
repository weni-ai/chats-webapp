import http from '@/services/api/http';
import { getProject } from '@/utils/config';

const uuid = getProject();

export default {
  async getListOfContacts(next) {
    const response = await http.get(`/project/${uuid}/list_contacts/`, {
      params: {
        cursor: next,
      },
    });
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

  async listAccess() {
    const response = await http.get(`/project/${uuid}/list_access`);
    return response.data;
  },

  async createContact(contact) {
    const response = await http.post(`/project/${uuid}/create_contacts/`, contact);
    return response.data;
  },

  async sendTemplate(object) {
    const response = await http.post(`/project/${uuid}/start_flow/`, object);
    return response.data;
  },
};
