import { vi, describe, it, expect } from 'vitest';
import roomService from '../room';
import http from '@/services/api/http';
import { useProfile } from '@/store/modules/profile';

vi.mock('@/services/api/http');

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

vi.mock('@/store/modules/profile');

describe('Room service', () => {
  describe('getAll', () => {
    it('should make a GET request with correct params and return the response data', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        offset: 0,
        limit: 10,
        contact: 'contact_name',
        order: 'asc',
        viewedAgent: 'agent@example.com',
      };

      const result = await roomService.getAll(
        params.offset,
        params.limit,
        params.contact,
        params.order,
        params.viewedAgent,
      );

      expect(http.get).toHaveBeenCalledWith('/room/', {
        params: {
          is_active: true,
          project: 'mocked-project-id',
          offset: params.offset,
          limit: params.limit,
          ordering: params.order,
          search: params.contact,
          email: params.viewedAgent,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getByUuid', () => {
    it('should make a GET request with correct UUID and return the response data', async () => {
      const mockResponse = { data: {} };
      http.get.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.getByUuid({ uuid });

      expect(http.get).toHaveBeenCalledWith(`/room/${uuid}/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should log an error if no UUID is provided', async () => {
      const spyError = vi.spyOn(console, 'error').mockImplementation();

      const result = await roomService.getByUuid({ uuid: '' });

      expect(spyError).toHaveBeenCalledWith(
        '"Uuid" necessário para requisição.',
      );
      expect(result).toBeUndefined();

      spyError.mockRestore();
    });
  });

  describe('getCanUseCopilot', () => {
    it('should make a GET request with correct UUID and return the response data', async () => {
      const mockResponse = { data: {} };
      http.get.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.getCanUseCopilot({ uuid });

      expect(http.get).toHaveBeenCalledWith(`/room/${uuid}/chat_completion/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should log an error if no UUID is provided', async () => {
      const spyError = vi.spyOn(console, 'error').mockImplementation();

      const result = await roomService.getCanUseCopilot({ uuid: '' });

      expect(spyError).toHaveBeenCalledWith(
        '"Uuid" necessário para requisição.',
      );
      expect(result).toBeUndefined();

      spyError.mockRestore();
    });
  });

  describe('getCopilotSuggestion', () => {
    it('should make a POST request with correct UUID and return the response data', async () => {
      const mockResponse = { data: {} };
      http.post.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.getCopilotSuggestion({ uuid });

      expect(http.post).toHaveBeenCalledWith(`/room/${uuid}/chat_completion/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should log an error if no UUID is provided', async () => {
      const spyError = vi.spyOn(console, 'error').mockImplementation();

      const result = await roomService.getCopilotSuggestion({ uuid: '' });

      expect(spyError).toHaveBeenCalledWith(
        '"Uuid" necessário para requisição.',
      );
      expect(result).toBeUndefined();

      spyError.mockRestore();
    });
  });

  describe('close', () => {
    it('should make a PUT request with correct UUID and tags and return the response data', async () => {
      const mockResponse = { data: {} };
      http.put.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.close(uuid);

      expect(http.put).toHaveBeenCalledWith(`/room/${uuid}/close/`, {
        tags: [],
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('bulkTransfer', () => {
    it('should make a PATCH request with correct parameters and return the response data', async () => {
      const mockResponse = { data: {} };
      http.patch.mockResolvedValue(mockResponse);
      const rooms = ['room-1', 'room-2'];
      const intendedAgent = 'agent@example.com';
      const params = { rooms, intended_agent: intendedAgent };

      const profileStore = { me: { email: 'user@example.com' } };
      useProfile.mockReturnValue(profileStore);

      const result = await roomService.bulkTranfer(params);

      expect(http.patch).toHaveBeenCalledWith(
        'room/bulk_transfer/',
        { rooms_list: rooms },
        {
          params: {
            queue_uuid: '',
            user_request: 'user@example.com',
            user_email: intendedAgent,
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('pinRoom', () => {
    it('should make a POST request to pin a room with default status true', async () => {
      const mockResponse = { data: { success: true } };
      http.post.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.pinRoom({ uuid });

      expect(http.post).toHaveBeenCalledWith(`/room/${uuid}/pin/`, {
        status: true,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make a POST request to pin a room with explicit status true', async () => {
      const mockResponse = { data: { success: true } };
      http.post.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const status = true;

      const result = await roomService.pinRoom({ uuid, status });

      expect(http.post).toHaveBeenCalledWith(`/room/${uuid}/pin/`, {
        status: true,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make a POST request to unpin a room with status false', async () => {
      const mockResponse = { data: { success: true } };
      http.post.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const status = false;

      const result = await roomService.pinRoom({ uuid, status });

      expect(http.post).toHaveBeenCalledWith(`/room/${uuid}/pin/`, {
        status: false,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle HTTP errors when pinning fails', async () => {
      const mockError = new Error('Network error');
      http.post.mockRejectedValue(mockError);
      const uuid = 'mocked-uuid';

      await expect(roomService.pinRoom({ uuid })).rejects.toThrow(
        'Network error',
      );
      expect(http.post).toHaveBeenCalledWith(`/room/${uuid}/pin/`, {
        status: true,
      });
    });

    it('should handle missing uuid parameter', async () => {
      const mockResponse = { data: { success: true } };
      http.post.mockResolvedValue(mockResponse);

      const result = await roomService.pinRoom({ uuid: undefined });

      expect(http.post).toHaveBeenCalledWith('/room/undefined/pin/', {
        status: true,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getClosed', () => {
    it('should make a GET request with is_active false and return the response data', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);

      const result = await roomService.getClosed();

      expect(http.get).toHaveBeenCalledWith('/room/', {
        params: { is_active: false },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle HTTP errors when getting closed rooms fails', async () => {
      const mockError = new Error('Server error');
      http.get.mockRejectedValue(mockError);

      await expect(roomService.getClosed()).rejects.toThrow('Server error');
    });
  });

  describe('updateReadMessages', () => {
    it('should make a PATCH request to mark messages as read', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const read = true;

      await roomService.updateReadMessages(uuid, read);

      expect(http.patch).toHaveBeenCalledWith(
        `/room/${uuid}/bulk_update_msgs/`,
        {
          seen: read,
        },
      );
    });

    it('should make a PATCH request to mark messages as unread', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const read = false;

      await roomService.updateReadMessages(uuid, read);

      expect(http.patch).toHaveBeenCalledWith(
        `/room/${uuid}/bulk_update_msgs/`,
        {
          seen: false,
        },
      );
    });

    it('should handle HTTP errors when updating read messages fails', async () => {
      const mockError = new Error('Update failed');
      http.patch.mockRejectedValue(mockError);
      const uuid = 'mocked-uuid';

      await expect(roomService.updateReadMessages(uuid, true)).rejects.toThrow(
        'Update failed',
      );
    });

    it('should handle undefined parameters', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);

      await roomService.updateReadMessages(undefined, undefined);

      expect(http.patch).toHaveBeenCalledWith(
        '/room/undefined/bulk_update_msgs/',
        {
          seen: undefined,
        },
      );
    });
  });

  describe('take', () => {
    it('should make a PUT request with user email', async () => {
      const mockResponse = { data: { success: true } };
      http.put.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const email = 'user@example.com';

      const result = await roomService.take(uuid, email);

      expect(http.put).toHaveBeenCalledWith(`/room/${uuid}/`, {
        user_email: email,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make a PUT request with queue UUID when no email provided', async () => {
      const mockResponse = { data: { success: true } };
      http.put.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const queueUuid = 'queue-uuid';

      const result = await roomService.take(uuid, null, queueUuid);

      expect(http.put).toHaveBeenCalledWith(`/room/${uuid}/`, {
        queue_uuid: queueUuid,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should prioritize email over queue UUID when both provided', async () => {
      const mockResponse = { data: { success: true } };
      http.put.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const email = 'user@example.com';
      const queueUuid = 'queue-uuid';

      const result = await roomService.take(uuid, email, queueUuid);

      expect(http.put).toHaveBeenCalledWith(`/room/${uuid}/`, {
        user_email: email,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle empty string email', async () => {
      const mockResponse = { data: { success: true } };
      http.put.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const queueUuid = 'queue-uuid';

      const result = await roomService.take(uuid, '', queueUuid);

      expect(http.put).toHaveBeenCalledWith(`/room/${uuid}/`, {
        queue_uuid: queueUuid,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle HTTP errors when taking room fails', async () => {
      const mockError = new Error('Take failed');
      http.put.mockRejectedValue(mockError);
      const uuid = 'mocked-uuid';

      await expect(roomService.take(uuid, 'user@example.com')).rejects.toThrow(
        'Take failed',
      );
    });
  });

  describe('getQueueRoom', () => {
    it('should make a PATCH request with user email from profile store', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);
      const profileStore = { me: { email: 'user@example.com' } };
      useProfile.mockReturnValue(profileStore);
      const uuid = 'mocked-uuid';

      const result = await roomService.getQueueRoom(uuid);

      expect(http.patch).toHaveBeenCalledWith(
        `/room/${uuid}/pick_queue_room/?user_email=user@example.com`,
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle missing user email in profile store', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);
      const profileStore = { me: { email: null } };
      useProfile.mockReturnValue(profileStore);
      const uuid = 'mocked-uuid';

      const result = await roomService.getQueueRoom(uuid);

      expect(http.patch).toHaveBeenCalledWith(
        `/room/${uuid}/pick_queue_room/?user_email=null`,
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle undefined user in profile store', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);
      const profileStore = { me: null };
      useProfile.mockReturnValue(profileStore);
      const uuid = 'mocked-uuid';

      const result = await roomService.getQueueRoom(uuid);

      expect(http.patch).toHaveBeenCalledWith(
        `/room/${uuid}/pick_queue_room/?user_email=undefined`,
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle HTTP errors when getting queue room fails', async () => {
      const mockError = new Error('Queue room failed');
      http.patch.mockRejectedValue(mockError);
      const profileStore = { me: { email: 'user@example.com' } };
      useProfile.mockReturnValue(profileStore);
      const uuid = 'mocked-uuid';

      await expect(roomService.getQueueRoom(uuid)).rejects.toThrow(
        'Queue room failed',
      );
    });
  });

  describe('updateCustomFields', () => {
    it('should make a PATCH request with custom fields and return response data', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';
      const customFields = { field1: 'value1', field2: 'value2' };

      const result = await roomService.updateCustomFields(uuid, customFields);

      expect(http.patch).toHaveBeenCalledWith(
        `/room/${uuid}/update_custom_fields/`,
        customFields,
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should make a PATCH request with empty custom fields object when not provided', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.updateCustomFields(uuid);

      expect(http.patch).toHaveBeenCalledWith(
        `/room/${uuid}/update_custom_fields/`,
        {},
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle null custom fields', async () => {
      const mockResponse = { data: { success: true } };
      http.patch.mockResolvedValue(mockResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.updateCustomFields(uuid, null);

      expect(http.patch).toHaveBeenCalledWith(
        `/room/${uuid}/update_custom_fields/`,
        null,
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle HTTP errors when updating custom fields fails', async () => {
      const mockError = new Error('Custom fields update failed');
      http.patch.mockRejectedValue(mockError);
      const uuid = 'mocked-uuid';

      await expect(roomService.updateCustomFields(uuid, {})).rejects.toThrow(
        'Custom fields update failed',
      );
    });
  });

  describe('getAll - additional edge cases', () => {
    it('should make a GET request without viewedAgent parameter', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);

      const result = await roomService.getAll(0, 10, 'contact', 'desc');

      expect(http.get).toHaveBeenCalledWith('/room/', {
        params: {
          is_active: true,
          project: 'mocked-project-id',
          offset: 0,
          limit: 10,
          ordering: 'desc',
          search: 'contact',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle null/undefined contact parameter', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);

      const result = await roomService.getAll(0, 10, null, 'asc');

      expect(http.get).toHaveBeenCalledWith('/room/', {
        params: {
          is_active: true,
          project: 'mocked-project-id',
          offset: 0,
          limit: 10,
          ordering: 'asc',
          search: null,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle HTTP errors when getting rooms fails', async () => {
      const mockError = new Error('Failed to fetch rooms');
      http.get.mockRejectedValue(mockError);

      await expect(roomService.getAll(0, 10, 'contact', 'asc')).rejects.toThrow(
        'Failed to fetch rooms',
      );
    });

    it('should handle zero offset and limit', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);

      const result = await roomService.getAll(0, 0, '', 'asc');

      expect(http.get).toHaveBeenCalledWith('/room/', {
        params: {
          is_active: true,
          project: 'mocked-project-id',
          offset: 0,
          limit: 0,
          ordering: 'asc',
          search: '',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCopilotSuggestion - additional edge cases', () => {
    it('should handle HTTP error responses and return error response', async () => {
      const mockErrorResponse = {
        response: { status: 500, data: { error: 'Server error' } },
      };
      http.post.mockRejectedValue(mockErrorResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.getCopilotSuggestion({ uuid });

      expect(result).toEqual(mockErrorResponse.response);
    });

    it('should handle successful response with proper data extraction', async () => {
      const mockSuccessResponse = {
        data: { choices: [{ message: { content: 'suggestion' } }] },
      };
      http.post.mockResolvedValue(mockSuccessResponse);
      const uuid = 'mocked-uuid';

      const result = await roomService.getCopilotSuggestion({ uuid });

      expect(result).toEqual(mockSuccessResponse.data);
    });
  });

  describe('bulkTransfer - additional edge cases', () => {
    it('should make a PATCH request with intended queue instead of agent', async () => {
      const mockResponse = { data: {} };
      http.patch.mockResolvedValue(mockResponse);
      const rooms = ['room-1', 'room-2'];
      const intendedQueue = 'queue-uuid';
      const params = { rooms, intended_queue: intendedQueue };

      const profileStore = { me: { email: 'user@example.com' } };
      useProfile.mockReturnValue(profileStore);

      const result = await roomService.bulkTranfer(params);

      expect(http.patch).toHaveBeenCalledWith(
        'room/bulk_transfer/',
        { rooms_list: rooms },
        {
          params: {
            user_request: 'user@example.com',
            queue_uuid: intendedQueue,
            user_email: '',
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty rooms array', async () => {
      const mockResponse = { data: {} };
      http.patch.mockResolvedValue(mockResponse);
      const params = { rooms: [], intended_agent: 'agent@example.com' };

      const profileStore = { me: { email: 'user@example.com' } };
      useProfile.mockReturnValue(profileStore);

      const result = await roomService.bulkTranfer(params);

      expect(http.patch).toHaveBeenCalledWith(
        'room/bulk_transfer/',
        { rooms_list: [] },
        {
          params: {
            queue_uuid: '',
            user_request: 'user@example.com',
            user_email: 'agent@example.com',
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle HTTP error responses and return error response', async () => {
      const mockErrorResponse = {
        response: { status: 400, data: { error: 'Bad request' } },
      };
      http.patch.mockRejectedValue(mockErrorResponse);
      const params = { rooms: ['room-1'], intended_agent: 'agent@example.com' };

      const profileStore = { me: { email: 'user@example.com' } };
      useProfile.mockReturnValue(profileStore);

      const result = await roomService.bulkTranfer(params);

      expect(result).toEqual(mockErrorResponse.response);
    });

    it('should handle missing profile store email', async () => {
      const mockResponse = { data: {} };
      http.patch.mockResolvedValue(mockResponse);
      const params = { rooms: ['room-1'], intended_agent: 'agent@example.com' };

      const profileStore = { me: { email: undefined } };
      useProfile.mockReturnValue(profileStore);

      const result = await roomService.bulkTranfer(params);

      expect(http.patch).toHaveBeenCalledWith(
        'room/bulk_transfer/',
        { rooms_list: ['room-1'] },
        {
          params: {
            queue_uuid: '',
            user_request: undefined,
            user_email: 'agent@example.com',
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle missing intended agent and queue', async () => {
      const mockResponse = { data: {} };
      http.patch.mockResolvedValue(mockResponse);
      const params = { rooms: ['room-1'] };

      const profileStore = { me: { email: 'user@example.com' } };
      useProfile.mockReturnValue(profileStore);

      const result = await roomService.bulkTranfer(params);

      expect(http.patch).toHaveBeenCalledWith(
        'room/bulk_transfer/',
        { rooms_list: ['room-1'] },
        {
          params: {
            user_email: '',
            user_request: 'user@example.com',
            queue_uuid: '',
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('close - additional edge cases', () => {
    it('should handle HTTP errors when closing room fails', async () => {
      const mockError = new Error('Close failed');
      http.put.mockRejectedValue(mockError);
      const uuid = 'mocked-uuid';

      await expect(roomService.close(uuid, ['tag1'])).rejects.toThrow(
        'Close failed',
      );
    });

    it('should handle undefined uuid', async () => {
      const mockResponse = { data: {} };
      http.put.mockResolvedValue(mockResponse);

      const result = await roomService.close(undefined);

      expect(http.put).toHaveBeenCalledWith('/room/undefined/close/', {
        tags: [],
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
