import { describe, it, expect, vi, beforeEach } from 'vitest';
import FlowsTringger from '../flowsTrigger';
import http from '@/services/api/http';
import { getProject } from '@/utils/config';

vi.mock('@/services/api/http');
vi.mock('@/utils/config');

beforeEach(() => {
  vi.resetAllMocks();
  getProject.mockReturnValue('mock-project-uuid');
});

describe('FlowsTringger', () => {
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
});
