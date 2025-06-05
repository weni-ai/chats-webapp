import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import pauseStatusService from '../pauseStatus';
import http from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('PauseStatus service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCustomStatusType', () => {
    it('should create a custom status type', async () => {
      const mockResponse = {
        data: {
          uuid: 'status-123',
          name: 'Coffee Break',
          project: 'project-456',
        },
      };
      http.post.mockResolvedValue(mockResponse);

      const status = {
        name: 'Coffee Break',
        project: 'project-456',
      };

      const result = await pauseStatusService.createCustomStatusType({
        status,
      });

      expect(http.post).toHaveBeenCalledWith('custom_status_type/', status);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteCustomStatusType', () => {
    it('should delete a custom status type', async () => {
      const mockResponse = { data: { success: true } };
      http.delete.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.deleteCustomStatusType({
        statusUuid: 'status-123',
      });

      expect(http.delete).toHaveBeenCalledWith(
        'custom_status_type/status-123/',
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCustomBreakStatusTypeList', () => {
    it('should fetch custom break status type list', async () => {
      const mockResponse = {
        data: {
          results: [
            { uuid: 'break-1', name: 'Lunch Break' },
            { uuid: 'break-2', name: 'Meeting' },
          ],
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.getCustomBreakStatusTypeList({
        projectUuid: 'project-123',
      });

      expect(http.get).toHaveBeenCalledWith(
        'custom_status_type/?project=project-123',
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCustomStatusTypeList', () => {
    it('should return default statuses with custom statuses', async () => {
      const mockResponse = {
        data: {
          results: [
            { uuid: 'custom-1', name: 'Custom Break' },
            { uuid: 'custom-2', name: 'Training' },
          ],
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.getCustomStatusTypeList({
        projectUuid: 'project-456',
      });

      expect(http.get).toHaveBeenCalledWith(
        'custom_status_type/?project=project-456',
      );
      expect(result).toEqual([
        { value: 'active', label: 'Online', color: 'green', statusUuid: null },
        {
          value: 'inactive',
          label: 'Offline',
          color: 'gray',
          statusUuid: null,
        },
        { value: 'custom-1', label: 'Custom Break', color: 'brown' },
        { value: 'custom-2', label: 'Training', color: 'brown' },
      ]);
    });

    it('should return only default statuses when no custom statuses exist', async () => {
      const mockResponse = {
        data: {
          results: [],
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.getCustomStatusTypeList({
        projectUuid: 'project-789',
      });

      expect(result).toEqual([
        { value: 'active', label: 'Online', color: 'green', statusUuid: null },
        {
          value: 'inactive',
          label: 'Offline',
          color: 'gray',
          statusUuid: null,
        },
      ]);
    });

    it('should handle undefined results', async () => {
      const mockResponse = {
        data: {},
      };
      http.get.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.getCustomStatusTypeList({
        projectUuid: 'project-empty',
      });

      expect(result).toEqual([
        { value: 'active', label: 'Online', color: 'green', statusUuid: null },
        {
          value: 'inactive',
          label: 'Offline',
          color: 'gray',
          statusUuid: null,
        },
      ]);
    });
  });

  describe('getCustomStatusType', () => {
    it('should fetch a specific custom status type', async () => {
      const mockResponse = {
        data: {
          uuid: 'status-456',
          name: 'Meeting Break',
          project: 'project-123',
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.getCustomStatusType({
        statusUuid: 'status-456',
      });

      expect(http.get).toHaveBeenCalledWith('custom_status_type/status-456/');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createCustomStatus', () => {
    it('should create a custom status with correct parameters', async () => {
      const mockResponse = {
        data: {
          id: 789,
          user: 'user@example.com',
          status_type: 'break-type-123',
          break_time: 0,
        },
      };
      http.post.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.createCustomStatus({
        email: 'user@example.com',
        statusType: 'break-type-123',
      });

      expect(http.post).toHaveBeenCalledWith('custom_status/', {
        user: 'user@example.com',
        status_type: 'break-type-123',
        break_time: 0,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('closeCustomStatus', () => {
    it('should close a custom status with provided parameters', async () => {
      const mockResponse = {
        data: {
          id: 789,
          end_time: '2023-01-01T12:00:00Z',
          is_active: false,
        },
      };
      http.post.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.closeCustomStatus({
        statusUuid: 'status-789',
        endTime: '2023-01-01T12:00:00Z',
        isActive: false,
      });

      expect(http.post).toHaveBeenCalledWith(
        'custom_status/status-789/close_status/',
        {
          end_time: '2023-01-01T12:00:00Z',
          is_active: false,
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getActiveCustomStatus', () => {
    it('should return active custom status when available', async () => {
      const mockResponse = {
        data: {
          id: 456,
          status_type: 'break-123',
          is_active: true,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const result = await pauseStatusService.getActiveCustomStatus();

      expect(http.get).toHaveBeenCalledWith('custom_status/last_status/');
      expect(result).toEqual(mockResponse.data);
    });

    it('should return null when no active status (404 error)', async () => {
      const error = {
        response: {
          status: 404,
        },
      };
      http.get.mockRejectedValue(error);

      const result = await pauseStatusService.getActiveCustomStatus();

      expect(http.get).toHaveBeenCalledWith('custom_status/last_status/');
      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      const error = {
        response: {
          status: 500,
        },
      };
      http.get.mockRejectedValue(error);

      await expect(
        pauseStatusService.getActiveCustomStatus(),
      ).rejects.toThrow();

      expect(http.get).toHaveBeenCalledWith('custom_status/last_status/');
    });

    it('should throw error when no response object', async () => {
      const error = new Error('Network error');
      http.get.mockRejectedValue(error);

      await expect(pauseStatusService.getActiveCustomStatus()).rejects.toThrow(
        'Network error',
      );
    });
  });
});
