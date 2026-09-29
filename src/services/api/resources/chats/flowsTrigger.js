import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import { getURLParams } from '@/utils/requests';

const USE_OUT_OF_WHATSAPP_WINDOW_CONTACTS_MOCK = true;

const OUT_OF_WINDOW_CONTACT_NAMES = [
  'Ana Souza',
  'Bruno Lima',
  'Camila Rocha',
  'Diego Alves',
  'Elena Costa',
  'Fabio Nunes',
  'Gabriela Dias',
  'Henrique Melo',
  'Iris Ferreira',
  'Joao Pinto',
  'Karina Barbosa',
  'Lucas Mendes',
  'Marina Teixeira',
  'Nicolas Araujo',
  'Olivia Cardoso',
  'Paulo Ribeiro',
  'Queila Martins',
  'Rafael Gomes',
  'Sara Duarte',
  'Tiago Moreira',
];

const OUT_OF_WINDOW_MOCK_CONTACTS = [
  {
    uuid: 'out-of-window-unnamed',
    name: '',
    urns: [{ scheme: 'ext', path: '1271308922142' }],
  },
  ...OUT_OF_WINDOW_CONTACT_NAMES.flatMap((name, nameIndex) =>
    [0, 1].map((copy) => {
      const index = nameIndex * 2 + copy + 1;
      return {
        uuid: `out-of-window-${index}`,
        name: copy === 0 ? name : `${name} ${copy + 1}`,
        urns: [
          {
            scheme: index % 4 === 0 ? 'ext' : 'whatsapp',
            path: `55119${String(10000000 + index)}`,
          },
        ],
      };
    }),
  ),
];

function mockOutOfWhatsappWindowContacts({
  nextReq,
  search,
  limit = 20,
  offset = 0,
} = {}) {
  const query = new URLSearchParams(nextReq?.split('?')[1] || '');
  const pageLimit = Number(query.get('limit') || limit);
  const pageOffset = Number(query.get('offset') || offset);
  const pageSearch = query.get('search') ?? search ?? '';
  const normalizedSearch = pageSearch.trim().toLowerCase();

  const filtered = OUT_OF_WINDOW_MOCK_CONTACTS.filter((contact) => {
    if (!normalizedSearch) return true;
    const urn = contact.urns?.[0];
    const subtitle = urn ? `${urn.scheme}:${urn.path}` : '';
    return `${contact.name} ${subtitle}`
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const endpoint = '/contacts/out_off_whatsapp_response_window/';
  const nextOffset = pageOffset + pageLimit;
  const searchQuery = pageSearch
    ? `&search=${encodeURIComponent(pageSearch)}`
    : '';

  return {
    count: filtered.length,
    previous:
      pageOffset > 0
        ? `${endpoint}?limit=${pageLimit}&offset=${Math.max(pageOffset - pageLimit, 0)}${searchQuery}`
        : null,
    next:
      nextOffset < filtered.length
        ? `${endpoint}?limit=${pageLimit}&offset=${nextOffset}${searchQuery}`
        : null,
    results: filtered.slice(pageOffset, nextOffset),
  };
}

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
    if (USE_OUT_OF_WHATSAPP_WINDOW_CONTACTS_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockOutOfWhatsappWindowContacts({
        nextReq,
        search,
        limit,
        offset,
      });
    }

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
    };

    if (sectors) params.sectors = sectors;
    if (queues) params.queues = queues;
    if (search) params.search = search;

    const response = await http.get(endpoint, { params });
    return response.data;
  },

  async startOutOfWhatsappWindowFlow({ flow, ignored_contacts }, projectUuid) {
    const response = await http.post(
      `/project/${projectUuid || getProject()}/out_off_whats_app_response_window/start_flow/`,
      { flow, ignored_contacts },
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
