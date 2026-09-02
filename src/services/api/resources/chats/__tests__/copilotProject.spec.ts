import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from '@/services/api/http';
import CopilotProjectService, {
  normalizeCopilotProject,
  normalizeCopilotProjectSummary,
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
};

const existingProjectsResponse = [
  {
    name: 'projeto copilot teste',
    assigned_agents: 5,
    uuid: 'copilot-uuid',
    project_uuid: 'desk-uuid',
  },
  {
    name: 'another copilot',
    assigned_agents: 2,
    uuid: 'copilot-uuid-2',
    project_uuid: 'desk-uuid-2',
  },
];

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

    it('normalizes connect_by into connectedBy', () => {
      expect(normalizeCopilotProject(linkedProjectResponse)).toEqual({
        name: 'projeto copilot teste',
        assignedAgents: 5,
        createdOn: '2026-07-30T00:00:00Z',
        connectedOn: '2026-07-30T00:00:00Z',
        uuid: 'copilot-uuid',
        projectUuid: 'desk-uuid',
        connectedBy: 'edu',
      });
    });
  });

  describe('normalizeCopilotProjectSummary', () => {
    it('returns null for empty payloads', () => {
      expect(normalizeCopilotProjectSummary(null)).toBeNull();
      expect(normalizeCopilotProjectSummary({})).toBeNull();
    });

    it('normalizes a summary payload', () => {
      expect(
        normalizeCopilotProjectSummary(existingProjectsResponse[0]),
      ).toEqual({
        name: 'projeto copilot teste',
        assignedAgents: 5,
        uuid: 'copilot-uuid',
        projectUuid: 'desk-uuid',
      });
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
    });

    it('returns null when the API has no linked project', async () => {
      http.get.mockResolvedValue({ data: null });

      await expect(
        CopilotProjectService.getLinkedProject('desk-uuid'),
      ).resolves.toBeNull();
    });
  });

  describe('listExistingProjects', () => {
    it('requests the existing projects by org uuid', async () => {
      http.get.mockResolvedValue({ data: existingProjectsResponse });

      const result =
        await CopilotProjectService.listExistingProjects('org-uuid');

      expect(http.get).toHaveBeenCalledWith(
        '/project/copilot/list_existing_projects/org-uuid',
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'projeto copilot teste',
        assignedAgents: 5,
        uuid: 'copilot-uuid',
        projectUuid: 'desk-uuid',
      });
    });

    it('returns an empty list when the payload is not an array', async () => {
      http.get.mockResolvedValue({ data: null });

      await expect(
        CopilotProjectService.listExistingProjects('org-uuid'),
      ).resolves.toEqual([]);
    });

    it('skips items without a uuid', async () => {
      http.get.mockResolvedValue({
        data: [{ name: 'invalid' }, existingProjectsResponse[0]],
      });

      const result =
        await CopilotProjectService.listExistingProjects('org-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('copilot-uuid');
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

  describe('update', () => {
    it('puts the new copilot uuid and returns the linked project', async () => {
      http.put.mockResolvedValue({
        data: {
          ...linkedProjectResponse,
          connected_by: 'edu',
        },
      });

      const result = await CopilotProjectService.update(
        'desk-uuid',
        'copilot-uuid-2',
      );

      expect(http.put).toHaveBeenCalledWith(
        '/project/copilot/update/desk-uuid',
        { new_uuid: 'copilot-uuid-2' },
      );
      expect(result.uuid).toBe('copilot-uuid');
      expect(result.connectedBy).toBe('edu');
    });

    it('throws when the response cannot be normalized', async () => {
      http.put.mockResolvedValue({ data: {} });

      await expect(
        CopilotProjectService.update('desk-uuid', 'copilot-uuid-2'),
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
});
