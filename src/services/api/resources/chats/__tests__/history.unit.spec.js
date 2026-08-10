import { vi, describe, it, expect } from 'vitest';
import apiService from '../history';
import http from '@/services/api/http';
import { getProject } from '@/utils/config';

vi.mock('@/services/api/http');
vi.mock('@/utils/config');

describe('History Chat Service', () => {
  describe('getHistoryRooms', () => {
    it('should make a GET request to /history/rooms/ with correct params', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);
      getProject.mockReturnValue('mocked-project-id');

      const params = {
        offset: 0,
        limit: 5,
        ended_at_before: '',
        ended_at_after: '',
        search: '',
        sector: '',
        tag: '',
      };

      const result = await apiService.getHistoryRooms(params);

      expect(http.get).toHaveBeenCalledWith('/history/rooms/', {
        params: {
          project: 'mocked-project-id',
          offset: 0,
          limit: 5,
          ended_at_before: '',
          ended_at_after: '',
          sector: '',
          tag: '',
          ordering: '-ended_at',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should send contact, email, and document when provided', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);
      getProject.mockReturnValue('mocked-project-id');

      await apiService.getHistoryRooms({
        offset: 0,
        limit: 5,
        contact: 'abc-123',
        email: 'test@example.com',
        document: '12345678900',
      });

      expect(http.get).toHaveBeenCalledWith('/history/rooms/', {
        params: {
          project: 'mocked-project-id',
          offset: 0,
          limit: 5,
          ended_at_before: '',
          ended_at_after: '',
          sector: '',
          tag: '',
          ordering: '-ended_at',
          contact: 'abc-123',
          email: 'test@example.com',
          document: '12345678900',
        },
      });
    });

    it('should send search when provided', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);
      getProject.mockReturnValue('mocked-project-id');

      await apiService.getHistoryRooms({
        offset: 0,
        limit: 5,
        search: 'manual query',
      });

      expect(http.get).toHaveBeenCalledWith('/history/rooms/', {
        params: expect.objectContaining({
          search: 'manual query',
        }),
      });
    });
  });

  describe('getHistoryContactRoomsUuids', () => {
    it('should make a GET request to /history/rooms/ with correct params', async () => {
      const mockResponse = { data: [] };
      http.get.mockResolvedValue(mockResponse);
      getProject.mockReturnValue('mocked-project-id');

      const external_id = 'mocked-external-id';

      const result = await apiService.getHistoryContactRoomsUuids({
        external_id,
      });

      expect(http.get).toHaveBeenCalledWith('/history/rooms/', {
        params: {
          project: 'mocked-project-id',
          contact: external_id,
          ordering: 'ended_at',
          basic: true,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getHistoryContactRoom', () => {
    it('should make a GET request to /history/rooms/{room}/ with correct params', async () => {
      const mockResponse = { data: {} };
      http.get.mockResolvedValue(mockResponse);
      getProject.mockReturnValue('mocked-project-id');

      const room = 'mocked-room-id';

      const result = await apiService.getHistoryContactRoom({ room });

      expect(http.get).toHaveBeenCalledWith(`/history/rooms/${room}/`, {
        params: {
          project: 'mocked-project-id',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should catch and return error response on failure', async () => {
      const mockError = { response: { status: 404, data: 'Not Found' } };
      http.get.mockRejectedValue(mockError);
      getProject.mockReturnValue('mocked-project-id');

      const room = 'mocked-room-id';

      const result = await apiService.getHistoryContactRoom({ room });

      expect(result).toEqual(mockError.response);
    });
  });

  describe('exportRoom', () => {
    it('should make a POST request to /chats/report/room/ with room and types', async () => {
      const mockResponse = { data: { status: 'processing' } };
      http.post.mockResolvedValue(mockResponse);

      const params = {
        room: 'room-uuid-123',
        types: ['PDF'],
      };

      const result = await apiService.exportRoom(params);

      expect(http.post).toHaveBeenCalledWith('/chats/report/room/', {
        room: 'room-uuid-123',
        types: ['PDF'],
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should send multiple types when both are selected', async () => {
      const mockResponse = { data: { status: 'processing' } };
      http.post.mockResolvedValue(mockResponse);

      const params = {
        room: 'room-uuid-456',
        types: ['PDF', 'HTML'],
      };

      const result = await apiService.exportRoom(params);

      expect(http.post).toHaveBeenCalledWith('/chats/report/room/', {
        room: 'room-uuid-456',
        types: ['PDF', 'HTML'],
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw on API failure', async () => {
      const mockError = new Error('Network error');
      http.post.mockRejectedValue(mockError);

      await expect(
        apiService.exportRoom({ room: 'room-uuid', types: ['PDF'] }),
      ).rejects.toThrow('Network error');
    });
  });
});
