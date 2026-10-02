import { describe, it, expect, vi, beforeEach } from 'vitest';
import FlowsTringger from '../flowsTrigger';
import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import { useProfile } from '@/store/modules/profile';

vi.mock('@/services/api/http');
vi.mock('@/utils/config');
vi.mock('@/store/modules/profile', () => ({
  useProfile: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  getProject.mockReturnValue('mock-project-uuid');
  useProfile.mockReturnValue({ me: { email: 'agent@example.com' } });
});

describe('FlowsTringger service', () => {
  it('should get a list of contacts', async () => {
    const mockResponse = { results: [], next: null };
    http.get.mockResolvedValue({ data: mockResponse });

    const nextCursor = 'mock-cursor';
    const searchQuery = 'mock-name';

    const result = await FlowsTringger.getListOfContacts(
      nextCursor,
      searchQuery,
    );

    expect(http.get).toHaveBeenCalledWith(
      `/project/mock-project-uuid/list_contacts/`,
      {
        params: {
          cursor: nextCursor,
          name: searchQuery,
        },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  it('should get a list of groups', async () => {
    const mockResponse = { groups: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.getListOfGroups();

    expect(http.get).toHaveBeenCalledWith(
      `/project/mock-project-uuid/list_groups/`,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should get all flows with pagination', async () => {
    const mockResponsePage1 = {
      results: [{ id: 'flow-1' }],
      next: 'cursor-page-2',
    };
    const mockResponsePage2 = {
      results: [{ id: 'flow-2' }],
      next: null,
    };

    http.get
      .mockResolvedValueOnce({ data: mockResponsePage1 })
      .mockResolvedValueOnce({ data: mockResponsePage2 });

    const result = await FlowsTringger.getFlows();

    expect(http.get).toHaveBeenCalledWith(
      `/project/mock-project-uuid/list_flows/`,
      {
        params: { cursor: undefined },
      },
    );
    expect(http.get).toHaveBeenCalledWith(
      `/project/mock-project-uuid/list_flows/`,
      {
        params: { cursor: 'cursor-page-2' },
      },
    );
    expect(result).toEqual([{ id: 'flow-1' }, { id: 'flow-2' }]);
  });

  it('should forward extra params when getting flows', async () => {
    const mockResponse = { results: [{ id: 'flow-1' }], next: null };
    http.get.mockResolvedValue({ data: mockResponse });

    const projectUuid = 'custom-project-uuid';
    const extraParams = { verify_chats_tag: true };

    const result = await FlowsTringger.getFlows(projectUuid, extraParams);

    expect(http.get).toHaveBeenCalledWith(
      `/project/${projectUuid}/list_flows/`,
      {
        params: { cursor: undefined, verify_chats_tag: true },
      },
    );
    expect(result).toEqual([{ id: 'flow-1' }]);
  });

  it('should get flow trigger details', async () => {
    const mockFlowUuid = 'mock-flow-uuid';
    const mockResponse = { trigger: 'mock-trigger' };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.getFlowTrigger(mockFlowUuid);

    expect(http.get).toHaveBeenCalledWith(
      `/project/mock-project-uuid/retrieve_flow_definitions/`,
      {
        params: { flow_uuid: mockFlowUuid },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  it('should list access', async () => {
    const mockResponse = { access: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.listAccess();

    expect(http.get).toHaveBeenCalledWith(
      `/project/mock-project-uuid/list_access/`,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should check contact', async () => {
    const mockContact = 'mock-contact';
    const mockResponse = { warning: false };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.checkContact(mockContact);

    expect(http.get).toHaveBeenCalledWith('project/retrieve_flow_warning/', {
      params: {
        project: 'mock-project-uuid',
        contact: mockContact,
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should list flows start', async () => {
    const mockResponse = { flows: [] };
    const params = {
      offset: 0,
      limit: 5,
      created_on_before: '2024-01-01',
      created_on_after: '2023-01-01',
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.listFlowsStart(params);

    expect(http.get).toHaveBeenCalledWith(
      `/project/mock-project-uuid/list_flows_start/`,
      {
        params,
      },
    );
    expect(result).toEqual(mockResponse);
  });

  it('should create a contact', async () => {
    const mockContact = { name: 'John Doe' };
    const mockResponse = { id: 'contact-id' };
    http.post.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.createContact(mockContact);

    expect(http.post).toHaveBeenCalledWith(
      `/project/mock-project-uuid/create_contacts/`,
      mockContact,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should send a flow', async () => {
    const mockPayload = { flow_id: 'mock-flow-id', contact_id: 'contact-id' };
    const mockResponse = { success: true };
    http.post.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.sendFlow(mockPayload);

    expect(http.post).toHaveBeenCalledWith(
      `/project/mock-project-uuid/start_flow/`,
      mockPayload,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should list contacts outside the whatsapp window', async () => {
    const mockResponse = {
      next: null,
      previous: null,
      count: 1,
      results: [{ uuid: 'contact-1', name: 'Ana', urns: [] }],
    };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.listOutOfWhatsappWindowContacts({
      sectors: 'sector-1,sector-2',
      queues: 'queue-1',
      search: 'ana',
      limit: 20,
      offset: 0,
    });

    expect(http.get).toHaveBeenCalledWith(
      '/contacts/out_off_whatsapp_response_window/',
      {
        params: {
          project: 'mock-project-uuid',
          limit: 20,
          offset: 0,
          user: 'agent@example.com',
          sectors: 'sector-1,sector-2',
          queues: 'queue-1',
          search: 'ana',
        },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  it('should omit empty filters when listing contacts outside the whatsapp window', async () => {
    http.get.mockResolvedValue({
      data: { results: [], count: 0, next: null },
    });

    await FlowsTringger.listOutOfWhatsappWindowContacts({
      limit: 20,
      offset: 0,
    });

    expect(http.get).toHaveBeenCalledWith(
      '/contacts/out_off_whatsapp_response_window/',
      {
        params: {
          project: 'mock-project-uuid',
          limit: 20,
          offset: 0,
          user: 'agent@example.com',
        },
      },
    );
  });

  it('should follow the next url when listing more contacts outside the whatsapp window', async () => {
    const nextReq =
      'https://api.example.com/v1/contacts/out_off_whatsapp_response_window/?limit=20&offset=20&project=mock-project-uuid';
    http.get.mockResolvedValue({ data: { results: [], next: null } });

    await FlowsTringger.listOutOfWhatsappWindowContacts({ nextReq });

    expect(http.get).toHaveBeenCalledWith(
      '/contacts/out_off_whatsapp_response_window/?limit=20&offset=20&project=mock-project-uuid',
    );
  });

  it('should start a flow for contacts outside the whatsapp window', async () => {
    const payload = {
      flow: 'flow-uuid',
      ignored_contacts: ['contact-2'],
      included_contacts: [],
      send_to_all: true,
    };
    http.post.mockResolvedValue({ data: { success: true } });

    const result = await FlowsTringger.startOutOfWhatsappWindowFlow(
      payload,
      'custom-project-uuid',
    );

    expect(http.post).toHaveBeenCalledWith(
      '/project/custom-project-uuid/out_off_whatsapp_response_window/start_flow/',
      payload,
    );
    expect(result).toEqual({ success: true });
  });

  it('should start the expired window flow for included contacts when send_to_all is false', async () => {
    const payload = {
      flow: 'flow-uuid',
      ignored_contacts: [],
      included_contacts: ['contact-1'],
      send_to_all: false,
    };
    http.post.mockResolvedValue({ data: { success: true } });

    await FlowsTringger.startOutOfWhatsappWindowFlow(payload);

    expect(http.post).toHaveBeenCalledWith(
      '/project/mock-project-uuid/out_off_whatsapp_response_window/start_flow/',
      payload,
    );
  });

  it('should start the expired window flow with the current project when projectUuid is not provided', async () => {
    http.post.mockResolvedValue({ data: { success: true } });

    await FlowsTringger.startOutOfWhatsappWindowFlow({
      flow: 'flow-uuid',
      ignored_contacts: [],
      included_contacts: [],
      send_to_all: true,
    });

    expect(http.post).toHaveBeenCalledWith(
      '/project/mock-project-uuid/out_off_whatsapp_response_window/start_flow/',
      {
        flow: 'flow-uuid',
        ignored_contacts: [],
        included_contacts: [],
        send_to_all: true,
      },
    );
  });

  it('should get flow templates with the current project when projectUuid is not provided', async () => {
    const mockResponse = {
      flow_uuid: 'mock-flow-uuid',
      total_template_qty: 0,
      templates: [],
    };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.getFlowTemplates('mock-flow-uuid');

    expect(http.get).toHaveBeenCalledWith(
      `/project/mock-project-uuid/flow_templates/`,
      { params: { flow: 'mock-flow-uuid' } },
    );
    expect(result).toEqual(mockResponse);
  });

  it('should get flow templates with the provided projectUuid', async () => {
    const mockResponse = {
      flow_uuid: 'mock-flow-uuid',
      total_template_qty: 1,
      templates: [{ variables: ['nomecontato'], data: {} }],
    };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await FlowsTringger.getFlowTemplates(
      'mock-flow-uuid',
      'custom-project-uuid',
    );

    expect(http.get).toHaveBeenCalledWith(
      `/project/custom-project-uuid/flow_templates/`,
      { params: { flow: 'mock-flow-uuid' } },
    );
    expect(result).toEqual(mockResponse);
  });
});
