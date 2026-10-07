import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from '@/services/api/http';
import CopilotProjectService, {
  normalizeCopilotProject,
} from '../copilotProject';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const linkedProjectResponse = {
  name: 'projeto copilot teste',
  assigned_agents: 5,
  created_on: '2026-07-30T00:00:00Z',
  connected_on: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  project_uuid: 'desk-uuid',
  connect_by: 'edu',
  is_connected: true,
};

describe('copilotProject service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeCopilotProject', () => {
    it('returns null for empty payloads', () => {
      expect(normalizeCopilotProject(null)).toBeNull();
      expect(normalizeCopilotProject({})).toBeNull();
      expect(normalizeCopilotProject([])).toBeNull();
    });

    it('normalizes connect_by into connectedBy and defaults isConnected to true', () => {
      expect(normalizeCopilotProject(linkedProjectResponse)).toEqual({
        name: 'projeto copilot teste',
        assignedAgents: 5,
        createdOn: '2026-07-30T00:00:00Z',
        connectedOn: '2026-07-30T00:00:00Z',
        uuid: 'copilot-uuid',
        projectUuid: 'desk-uuid',
        connectedBy: 'edu',
        isConnected: true,
        disconnectedBy: undefined,
        disconnectedOn: undefined,
      });
    });

    it('normalizes disconnect fields and is_connected false', () => {
      expect(
        normalizeCopilotProject({
          ...linkedProjectResponse,
          is_connected: false,
          disconnect_by: 'ana',
          disconnect_on: '2026-09-10T00:00:00Z',
        }),
      ).toEqual({
        name: 'projeto copilot teste',
        assignedAgents: 5,
        createdOn: '2026-07-30T00:00:00Z',
        connectedOn: '2026-07-30T00:00:00Z',
        uuid: 'copilot-uuid',
        projectUuid: 'desk-uuid',
        connectedBy: 'edu',
        isConnected: false,
        disconnectedBy: 'ana',
        disconnectedOn: '2026-09-10T00:00:00Z',
      });
    });

    it('defaults isConnected to true when the field is missing', () => {
      const { is_connected: _ignored, ...payload } = linkedProjectResponse;
      expect(normalizeCopilotProject(payload)?.isConnected).toBe(true);
    });
  });

  describe('getLinkedProject', () => {
    it('requests the linked project by uuid', async () => {
      http.get.mockResolvedValue({ data: linkedProjectResponse });

      const result = await CopilotProjectService.getLinkedProject('desk-uuid');

      expect(http.get).toHaveBeenCalledWith(
        '/project/copilot/linked_project/desk-uuid',
      );
      expect(result?.uuid).toBe('copilot-uuid');
      expect(result?.connectedBy).toBe('edu');
      expect(result?.isConnected).toBe(true);
    });

    it('returns null when the API has no linked project', async () => {
      http.get.mockResolvedValue({ data: null });

      await expect(
        CopilotProjectService.getLinkedProject('desk-uuid'),
      ).resolves.toBeNull();
    });
  });

  describe('create', () => {
    it('posts the project name and uuid and returns the created project', async () => {
      http.post.mockResolvedValue({
        data: {
          ...linkedProjectResponse,
          connected_by: 'edu',
        },
      });

      const result = await CopilotProjectService.create(
        'Sales 123',
        'desk-uuid',
      );

      expect(http.post).toHaveBeenCalledWith('/project/copilot/create', {
        name: 'Sales 123',
        project: 'desk-uuid',
      });
      expect(result.name).toBe('projeto copilot teste');
    });

    it('throws when the response cannot be normalized', async () => {
      http.post.mockResolvedValue({ data: {} });

      await expect(
        CopilotProjectService.create('Sales 123', 'desk-uuid'),
      ).rejects.toThrow('Invalid copilot project response');
    });
  });

  describe('reconnect', () => {
    it('puts is_connected true for the copilot uuid and returns the project', async () => {
      http.put.mockResolvedValue({
        data: {
          name: 'projeto copilot teste',
          assigned_agents: 5,
          created_on: '2026-07-30T00:00:00Z',
          connected_on: '2026-07-30T00:00:00Z',
          uuid: 'copilot-uuid',
          connected_by: 'edu',
        },
      });

      const result = await CopilotProjectService.reconnect('copilot-uuid');

      expect(http.put).toHaveBeenCalledWith(
        '/project/copilot/update/copilot-uuid',
        { is_connected: true },
      );
      expect(result.uuid).toBe('copilot-uuid');
      expect(result.connectedBy).toBe('edu');
      expect(result.isConnected).toBe(true);
    });

    it('throws when the response cannot be normalized', async () => {
      http.put.mockResolvedValue({ data: {} });

      await expect(
        CopilotProjectService.reconnect('copilot-uuid'),
      ).rejects.toThrow('Invalid copilot project response');
    });
  });

  describe('remove', () => {
    it('deletes the copilot project link by copilot uuid', async () => {
      http.delete.mockResolvedValue({ status: 200 });

      await CopilotProjectService.remove('copilot-uuid');

      expect(http.delete).toHaveBeenCalledWith(
        '/project/copilot/remove/copilot-uuid',
      );
    });
  });

  describe('canCreate', () => {
    it('returns true when the API allows project creation', async () => {
      http.get.mockResolvedValue({ data: { can_create: true } });

      await expect(CopilotProjectService.canCreate('desk-uuid')).resolves.toBe(
        true,
      );

      expect(http.get).toHaveBeenCalledWith(
        '/project/copilot/can_create/desk-uuid',
      );
    });

    it('returns false when the API denies project creation', async () => {
      http.get.mockResolvedValue({ data: { can_create: false } });

      await expect(CopilotProjectService.canCreate('desk-uuid')).resolves.toBe(
        false,
      );
    });

    it('returns false when can_create is missing from the payload', async () => {
      http.get.mockResolvedValue({ data: {} });

      await expect(CopilotProjectService.canCreate('desk-uuid')).resolves.toBe(
        false,
      );
    });
  });

  describe('supportsMultiAgents', () => {
    it('returns true when the project supports multi-agents', async () => {
      http.get.mockResolvedValue({ data: { multi_agents: true } });

      await expect(
        CopilotProjectService.supportsMultiAgents('desk-uuid'),
      ).resolves.toBe(true);

      expect(http.get).toHaveBeenCalledWith('/multi-agents/desk-uuid/');
    });

    it('returns false when the project does not support multi-agents', async () => {
      http.get.mockResolvedValue({ data: { multi_agents: false } });

      await expect(
        CopilotProjectService.supportsMultiAgents('desk-uuid'),
      ).resolves.toBe(false);
    });

    it('returns false when multi_agents is missing from the payload', async () => {
      http.get.mockResolvedValue({ data: {} });

      await expect(
        CopilotProjectService.supportsMultiAgents('desk-uuid'),
      ).resolves.toBe(false);
    });
  });
});
