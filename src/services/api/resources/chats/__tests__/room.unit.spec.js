import { vi, describe, it, expect } from 'vitest';
import roomService from '../room';
import http from '@/services/api/http';
import { useProfile } from '@/store/modules/profile';

vi.mock('@/services/api/http');

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

vi.mock('@/store/modules/profile');

describe('roomService', () => {
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
          ordering: `user,${params.order}`,
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
      const tags = ['tag1', 'tag2'];

      const result = await roomService.close(uuid, tags);

      expect(http.put).toHaveBeenCalledWith(`/room/${uuid}/close/`, { tags });
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
            user_request: 'user@example.com',
            user_email: intendedAgent,
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
