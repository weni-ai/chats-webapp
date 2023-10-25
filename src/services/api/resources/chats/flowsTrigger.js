import http from '@/services/api/http';
import { getProject } from '@/utils/config';

// const uuid = getProject();

export default {
  async getListOfContacts(next, search) {
    const response = await http.get(`/project/${getProject()}/list_contacts/`, {
      params: {
        cursor: next,
        name: search,
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

  async getFlowTrigger(uuidFlow) {
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

  async checkContact(contact) {
    const response = await http.get(`project/retrieve_flow_warning/`, {
      params: {
        project: getProject(),
        contact,
      },
    });
    return response.data;
  },
  async listFlowsStart({ offset = 0, limit = 5, ended_at_before = '', ended_at_after = '' }) {
    const response = await http.get(`/project/${getProject()}/list_flows_start/`, {
      params: {
        offset,
        limit,
        ended_at_before,
        ended_at_after,
      },
    });
    return response.data;
  },

  async createContact(contact) {
    const response = await http.post(`/project/${getProject()}/create_contacts/`, contact);
    return response.data;
  },

  async sendFlow(object) {
    const response = await http.post(`/project/${getProject()}/start_flow/`, object);
    return response.data;
  },
};
