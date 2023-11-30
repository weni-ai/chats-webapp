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
    let nextCursor;
    let flows = [];
    let loopCount = 0;
    const maxLoopCount = 10;

    async function fetchData(cursor) {
      const response = await http.get(`/project/${getProject()}/list_flows/`, {
        params: { cursor },
      });
      return response.data;
    }

    // Work around alert: This loop is required by ensures that all streams,
    // which contain the chats tag, are loaded before returning

    while ((nextCursor === undefined || nextCursor) && loopCount <= maxLoopCount) {
      // eslint-disable-next-line no-await-in-loop
      const responseData = await fetchData(nextCursor);
      flows = flows.concat(responseData.results);
      nextCursor = responseData.next;
      loopCount += 1;
    }

    return Promise.all(flows);
  },

  async getFlowTrigger(flowUuid) {
    if (!flowUuid) return null;

    const response = await http.get(`/project/${getProject()}/retrieve_flow_definitions/`, {
      params: {
        flow_uuid: flowUuid,
      },
    });
    return response.data;
  },

  async getFlowTemplateVariables(flowUuid) {
    if (!flowUuid) return null;

    const response = await http.get(`/project/${getProject()}/retrieve_flow_template_variables/`, {
      params: {
        flow_uuid: flowUuid,
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
  async listFlowsStart({ offset = 0, limit = 5, created_on_before = '', created_on_after = '' }) {
    const response = await http.get(`/project/${getProject()}/list_flows_start/`, {
      params: {
        offset,
        limit,
        created_on_before,
        created_on_after,
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
