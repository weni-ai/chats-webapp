import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import representative from '@/services/api/resources/settings/representative';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'test-project-uuid'),
}));

describe('representative service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProject.mockReturnValue('test-project-uuid');
  });

  describe('listAll', () => {
    it('should fetch agents with filter params', async () => {
      http.get.mockResolvedValue({ data: { results: [] } });

      const result = await representative.listAll({
        offset: 0,
        limit: 20,
        filters: {
          representatives: ['agent@test.com'],
          status: ['ONLINE'],
          sectors: ['sector-1'],
          queues: ['queue-1'],
        },
      });

      expect(http.get).toHaveBeenCalledWith(
        '/project/test-project-uuid/all_agents/',
        {
          params: {
            offset: 0,
            limit: 20,
            agent: 'agent@test.com',
            status: 'ONLINE',
            sector: 'sector-1',
            queue: 'queue-1',
          },
        },
      );
      expect(result).toEqual({ results: [] });
    });

    it('should send undefined for empty filter arrays', async () => {
      http.get.mockResolvedValue({ data: { results: [] } });

      await representative.listAll({
        offset: 10,
        limit: 5,
        filters: {
          representatives: [],
          status: [],
          sectors: [],
          queues: [],
        },
      });

      expect(http.get).toHaveBeenCalledWith(
        '/project/test-project-uuid/all_agents/',
        {
          params: {
            offset: 10,
            limit: 5,
            agent: undefined,
            status: undefined,
            sector: undefined,
            queue: undefined,
          },
        },
      );
    });
  });

  describe('listRepresentativeQueuePermission', () => {
    it('should fetch queue permissions for a representative', async () => {
      http.get.mockResolvedValue({
        data: { permissions: [{ uuid: 'perm-1' }] },
      });

      const result = await representative.listRepresentativeQueuePermission({
        representativeEmail: 'agent@test.com',
      });

      expect(http.get).toHaveBeenCalledWith('/agent/queue_permissions/', {
        params: {
          agent: 'agent@test.com',
          project: 'test-project-uuid',
        },
      });
      expect(result).toEqual({ permissions: [{ uuid: 'perm-1' }] });
    });
  });

  describe('updateRepresentativeQueuePermission', () => {
    it('should post queue permission updates with chats limit', async () => {
      http.post.mockResolvedValue({ data: { ok: true } });

      const result = await representative.updateRepresentativeQueuePermission({
        representatives: ['agent@test.com'],
        toRemove: ['queue-1'],
        toAdd: ['queue-2'],
        chatsLimit: { is_active: true, total: '10' },
      });

      expect(http.post).toHaveBeenCalledWith(
        '/agent/update_queue_permissions/',
        {
          agents: ['agent@test.com'],
          to_remove: ['queue-1'],
          to_add: ['queue-2'],
          chats_limit: {
            active: true,
            total: 10,
          },
          project: 'test-project-uuid',
        },
      );
      expect(result).toEqual({ ok: true });
    });

    it('should omit chats_limit when not provided', async () => {
      http.post.mockResolvedValue({ data: { ok: true } });

      await representative.updateRepresentativeQueuePermission({
        representatives: ['agent@test.com'],
        toRemove: [],
        toAdd: ['queue-2'],
      });

      expect(http.post).toHaveBeenCalledWith(
        '/agent/update_queue_permissions/',
        {
          agents: ['agent@test.com'],
          to_remove: [],
          to_add: ['queue-2'],
          chats_limit: undefined,
          project: 'test-project-uuid',
        },
      );
    });
  });
});
