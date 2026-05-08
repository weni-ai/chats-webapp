import { vi, describe, it, expect, beforeEach } from 'vitest';
import queueService from '../queues';
import http from '@/services/api/http';
import { useProfile } from '@/store/modules/profile';
import { useDashboard } from '@/store/modules/dashboard';

vi.mock('@/services/api/http');

vi.mock('@/store/modules/profile');

vi.mock('@/store/modules/dashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

describe('Queue service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getListQueues', () => {
    it('should make a GET request with correct params and return the response data', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);

      const mockProfile = { me: { email: 'user@example.com' } };
      useProfile.mockReturnValue(mockProfile);

      const result = await queueService.getListQueues();

      expect(http.get).toHaveBeenCalledWith('/queue/list_queue_permissions/', {
        params: {
          user_email: 'user@example.com',
          project: 'mocked-project-id',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('editListQueues', () => {
    it('should make PATCH requests for valid queues and return true if all requests are successful', async () => {
      const validQueues = [
        { uuid: 'queue-uuid-1', role: 'admin' },
        { uuid: 'queue-uuid-2', role: 'user' },
      ];
      const mockResponse = { status: 200 };
      http.patch.mockResolvedValue(mockResponse);

      const result = await queueService.editListQueues(validQueues);

      expect(http.patch).toHaveBeenCalledTimes(validQueues.length);
      validQueues.forEach((permission, index) => {
        expect(http.patch).toHaveBeenNthCalledWith(
          index + 1,
          `/authorization/queue/${permission.uuid}/update_queue_permissions/`,
          {
            role: permission.role,
          },
        );
      });
      expect(result).toBe(true);
    });

    it('should return false if any PATCH request fails', async () => {
      // Arrange
      const validQueues = [
        { uuid: 'queue-uuid-1', role: 'admin' },
        { uuid: 'queue-uuid-2', role: 'user' },
      ];
      const mockResponseSuccess = { status: 200 };
      const mockResponseFailure = { status: 400 };
      http.patch
        .mockResolvedValueOnce(mockResponseSuccess)
        .mockResolvedValueOnce(mockResponseFailure);

      const result = await queueService.editListQueues(validQueues);

      expect(result).toBe(false);
    });

    it('should filter out invalid queues (without uuid) and make PATCH requests only for valid ones', async () => {
      const invalidQueues = [
        { role: 'admin' },
        { uuid: 'queue-uuid-1', role: 'admin' },
        { uuid: 'queue-uuid-2', role: 'user' },
      ];
      const mockResponse = { status: 200 };
      http.patch.mockResolvedValue(mockResponse);

      const result = await queueService.editListQueues(invalidQueues);

      expect(http.patch).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });
  });

  describe('getQueuesToFilter', () => {
    it('should GET room counts by queue with project and viewed agent email', async () => {
      const mockData = { sectors: [{ name: 'S1', queues: [] }] };
      http.get.mockResolvedValue({ data: mockData });
      useDashboard.mockReturnValue({
        viewedAgent: { email: 'agent@example.com' },
      });

      const result = await queueService.getQueuesToFilter();

      expect(http.get).toHaveBeenCalledWith('/rooms_count/by_queue/', {
        params: {
          project: 'mocked-project-id',
          email: 'agent@example.com',
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should pass email as undefined when there is no viewed agent', async () => {
      http.get.mockResolvedValue({ data: {} });
      useDashboard.mockReturnValue({});

      await queueService.getQueuesToFilter();

      expect(http.get).toHaveBeenCalledWith('/rooms_count/by_queue/', {
        params: {
          project: 'mocked-project-id',
          email: undefined,
        },
      });
    });

    it('should pass email as undefined when viewedAgent has no email', async () => {
      http.get.mockResolvedValue({ data: {} });
      useDashboard.mockReturnValue({ viewedAgent: {} });

      await queueService.getQueuesToFilter();

      expect(http.get).toHaveBeenCalledWith('/rooms_count/by_queue/', {
        params: {
          project: 'mocked-project-id',
          email: undefined,
        },
      });
    });

    it('should return response data', async () => {
      const payload = { sectors: [] };
      http.get.mockResolvedValue({ data: payload });
      useDashboard.mockReturnValue({ viewedAgent: null });

      const result = await queueService.getQueuesToFilter();

      expect(result).toBe(payload);
    });
  });
});
