import { describe, it, expect, vi, beforeEach } from 'vitest';
import Media from '../media';
import http from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'test-project'),
}));

describe('Media Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractCursor', () => {
    it('should extract cursor from URL with cursor parameter', () => {
      const url =
        'https://api.example.com/media/?cursor=cD0yMDIzLTA5LTE1KzEzJTNBMjMlM0ExMi4xMjM0NTY=';
      const cursor = Media.extractCursor(url);

      expect(cursor).toBe('cD0yMDIzLTA5LTE1KzEzJTNBMjMlM0ExMi4xMjM0NTY=');
    });

    it('should return null for URL without cursor parameter', () => {
      const url = 'https://api.example.com/media/?page=2';
      const cursor = Media.extractCursor(url);

      expect(cursor).toBeNull();
    });

    it('should return null for null URL', () => {
      const cursor = Media.extractCursor(null);

      expect(cursor).toBeNull();
    });

    it('should return null for undefined URL', () => {
      const cursor = Media.extractCursor(undefined);

      expect(cursor).toBeNull();
    });

    it('should return null for invalid URL', () => {
      const cursor = Media.extractCursor('not-a-valid-url');

      expect(cursor).toBeNull();
    });

    it('should extract cursor from URL with multiple parameters', () => {
      const url =
        'https://api.example.com/media/?param1=value1&cursor=abc123&param2=value2';
      const cursor = Media.extractCursor(url);

      expect(cursor).toBe('abc123');
    });
  });

  describe('listFromContactAndRoom', () => {
    it('should call API with correct parameters including cursor', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, url: 'test.jpg' }],
          next: 'https://api.example.com/media/?cursor=next123',
          previous: 'https://api.example.com/media/?cursor=prev123',
        },
      };

      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await Media.listFromContactAndRoom({
        contact: 'contact-123',
        room: 'room-456',
        cursor: 'current123',
        content_type: 'media',
        ordering: 'content_type',
      });

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          contact: 'contact-123',
          room: 'room-456',
          cursor: 'current123',
          content_type: 'media',
          ordering: 'content_type',
          message: undefined,
          limit: undefined,
        },
      });

      expect(result).toEqual({
        results: [{ id: 1, url: 'test.jpg' }],
        next: 'https://api.example.com/media/?cursor=next123',
        previous: 'https://api.example.com/media/?cursor=prev123',
        nextCursor: 'next123',
        previousCursor: 'prev123',
      });
    });

    it('should return null cursors when next/previous are null', async () => {
      const mockResponse = {
        data: {
          results: [],
          next: null,
          previous: null,
        },
      };

      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await Media.listFromContactAndRoom({
        contact: 'contact-123',
        room: 'room-456',
      });

      expect(result).toEqual({
        results: [],
        next: null,
        previous: null,
        nextCursor: null,
        previousCursor: null,
      });
    });
  });

  describe('listFromContactAndClosedRoom', () => {
    it('should call API with correct parameters including cursor and project', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 2, url: 'test2.pdf' }],
          next: 'https://api.example.com/media/?cursor=next456',
          previous: null,
        },
      };

      vi.mocked(http.get).mockResolvedValue(mockResponse);

      const result = await Media.listFromContactAndClosedRoom({
        contact: 'contact-789',
        cursor: 'current456',
        content_type: 'documents',
      });

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          contact: 'contact-789',
          cursor: 'current456',
          content_type: 'documents',
          ordering: undefined,
          message: undefined,
          room: undefined,
          limit: undefined,
          project: 'test-project',
        },
      });

      expect(result).toEqual({
        results: [{ id: 2, url: 'test2.pdf' }],
        next: 'https://api.example.com/media/?cursor=next456',
        previous: null,
        nextCursor: 'next456',
        previousCursor: null,
      });
    });
  });
});
