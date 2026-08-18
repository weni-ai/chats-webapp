import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from '@/services/api/http';
import CopilotProjectService, {
  normalizeCopilotProject,
} from '../copilotProject';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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

    it('normalizes connect_by into connected_by', () => {
      expect(normalizeCopilotProject(linkedProjectResponse)).toEqual({
        name: 'projeto copilot teste',
        assigned_agents: 5,
        created_on: '2026-07-30T00:00:00Z',
        connected_on: '2026-07-30T00:00:00Z',
        uuid: 'copilot-uuid',
        project_uuid: 'desk-uuid',
        connected_by: 'edu',
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
      expect(result?.connected_by).toBe('edu');
    });

    it('returns null when the API has no linked project', async () => {
      http.get.mockResolvedValue({ data: null });

      await expect(
        CopilotProjectService.getLinkedProject('desk-uuid'),
      ).resolves.toBeNull();
    });
  });

  describe('create', () => {
    it('posts the project name and returns the created project', async () => {
      http.post.mockResolvedValue({
        data: {
          ...linkedProjectResponse,
          connected_by: 'edu',
        },
      });

      const result = await CopilotProjectService.create('Sales 123');

      expect(http.post).toHaveBeenCalledWith('/project/copilot/create', {
        name: 'Sales 123',
      });
      expect(result.name).toBe('projeto copilot teste');
    });

    it('throws when the response cannot be normalized', async () => {
      http.post.mockResolvedValue({ data: {} });

      await expect(CopilotProjectService.create('Sales 123')).rejects.toThrow(
        'Invalid copilot project response',
      );
    });
  });
});
