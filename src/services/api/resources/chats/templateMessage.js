import http from '@/services/api/http';
import { getProject } from '@/utils/config';

// const uuid = getProject();

export default {
  async getListOfContacts(next) {
    const response = await http.get(`/project/${getProject()}/list_contacts/`, {
      params: {
        cursor: next,
      },
    });
    return response.data;
  },

  async getListOfGroups() {
    const response = await http.get(`/project/${getProject()}/list_groups/`);
    return response.data;
  },

  async getFlows() {
    const response = await http.get(`/project/${getProject()}/list_flows`);
    return response.data;
  },

  async getTemplateFlow(uuidFlow) {
    const response = await http.get(`/project/${getProject()}/retrieve_flow_definitions/`, {
      params: {
        flow_uuid: uuidFlow,
      },
    });
    return response.data;
  },

  async listAccess() {
    const response = await http.get(`/project/${getProject()}/list_access`);
    return response.data;
  },

  async createContact(contact) {
    const response = await http.post(`/project/${getProject()}/create_contacts/`, contact);
    return response.data;
  },

  async sendTemplate(object) {
    const response = await http.post(`/project/${getProject()}/start_flow/`, object);
    return response.data;
  },
};
