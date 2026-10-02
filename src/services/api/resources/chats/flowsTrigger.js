import http from '@/services/api/http';
import { useProfile } from '@/store/modules/profile';
import { getProject } from '@/utils/config';
import { getURLParams } from '@/utils/requests';

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

  async getListOfGroups(projectUuid) {
    const response = await http.get(
      `/project/${projectUuid || getProject()}/list_groups/`,
    );
    return response.data;
  },

  async getFlows(projectUuidFlow, params = {}) {
    let nextCursor;
    let flows = [];
    let loopCount = 0;
    const maxLoopCount = 10;

    async function fetchData(cursor) {
      const response = await http.get(
        `/project/${projectUuidFlow || getProject()}/list_flows/`,
        {
          params: { cursor, ...params },
        },
      );
      return response.data;
    }

    // Work around alert: This loop is required by ensures that all streams,
    // which contain the chats tag, are loaded before returning

    while (
      (nextCursor === undefined || nextCursor) &&
      loopCount <= maxLoopCount
    ) {
      // eslint-disable-next-line no-await-in-loop
      const responseData = await fetchData(nextCursor);
      flows = flows.concat(responseData.results);
      nextCursor = responseData.next;
      loopCount += 1;
    }

    return Promise.all(flows);
  },

  async getFlowTrigger(uuidFlow) {
    const response = await http.get(
      `/project/${getProject()}/retrieve_flow_definitions/`,
      {
        params: {
          flow_uuid: uuidFlow,
        },
      },
    );
    return response.data;
  },

  async listAccess() {
    const response = await http.get(`/project/${getProject()}/list_access/`);
    return response.data;
  },

  async checkContact(contact, projectUuid) {
    const response = await http.get(`project/retrieve_flow_warning/`, {
      params: {
        project: projectUuid || getProject(),
        contact,
      },
    });
    return response.data;
  },
  async listFlowsStart(
    { offset = 0, limit = 5, created_on_before = '', created_on_after = '' },
    projectUuid,
  ) {
    const response = await http.get(
      `/project/${projectUuid || getProject()}/list_flows_start/`,
      {
        params: {
          offset,
          limit,
          created_on_before,
          created_on_after,
        },
      },
    );
    return response.data;
  },

  async createContact(contact, projectUuid) {
    const response = await http.post(
      `/project/${projectUuid || getProject()}/create_contacts/`,
      contact,
    );
    return response.data;
  },

  async sendFlow(object, projectUuid) {
    const response = await http.post(
      `/project/${projectUuid || getProject()}/start_flow/`,
      object,
    );
    return response.data;
  },

  async listOutOfWhatsappWindowContacts({
    nextReq,
    sectors,
    queues,
    search,
    limit = 20,
    offset = 0,
  } = {}) {
    const profileStore = useProfile();

    const endpoint = '/contacts/out_off_whatsapp_response_window/';
    const paramsNextReq = getURLParams({ URL: nextReq, endpoint });

    if (nextReq && paramsNextReq) {
      const response = await http.get(`${endpoint}${paramsNextReq}`);
      return response.data;
    }

    const params = {
      project: getProject(),
      limit,
      offset,
      user: profileStore.me?.email,
    };

    if (sectors) params.sectors = sectors;
    if (queues) params.queues = queues;
    if (search) params.search = search;

    const response = await http.get(endpoint, { params });
    return response.data;
  },

  async startOutOfWhatsappWindowFlow(
    { flow, ignored_contacts = [], included_contacts = [], send_to_all },
    projectUuid,
  ) {
    const response = await http.post(
      `/project/${projectUuid || getProject()}/out_off_whatsapp_response_window/start_flow/`,
      { flow, ignored_contacts, included_contacts, send_to_all },
    );
    return response.data;
  },

  async getFlowTemplates(flowUuid, projectUuid) {
    const response = await http.get(
      `/project/${projectUuid || getProject()}/flow_templates/`,
      {
        params: {
          flow: flowUuid,
        },
      },
    );
    return response.data;
  },
};
