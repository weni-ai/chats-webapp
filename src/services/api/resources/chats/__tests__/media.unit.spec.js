import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import mediaService from '../media';
import http from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

const { mockAxiosInstance } = vi.hoisted(() => {
  const mockAxiosInstance = {
    get: vi.fn(),
  };
  return { mockAxiosInstance };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

const mockCreateElement = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();

Object.defineProperty(global, 'document', {
  value: {
    createElement: mockCreateElement,
  },
  writable: true,
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

describe('Media service', () => {
  let mockLink;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get', () => {
    it('should fetch a blob from the provided URL', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/plain' });
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const url = 'https://example.com/file.pdf';
      const result = await mediaService.get(url);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(url, {
        responseType: 'blob',
      });
      expect(result).toBe(mockBlob);
    });

    it('should handle network errors when fetching blob', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      const url = 'https://example.com/file.pdf';

      await expect(mediaService.get(url)).rejects.toThrow('Network error');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(url, {
        responseType: 'blob',
      });
    });

    it('should handle empty URL gracefully', async () => {
      const mockBlob = new Blob([''], { type: 'text/plain' });
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await mediaService.get('');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('', {
        responseType: 'blob',
      });
      expect(result).toBe(mockBlob);
    });
  });

  describe('download', () => {
    it('should download a file with correct name and media URL', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = {
        media: 'https://example.com/document.pdf',
        name: 'my-document.pdf',
      };

      await mediaService.download(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(params.media, {
        responseType: 'blob',
      });

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe(params.name);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle download with special characters in filename', async () => {
      const mockBlob = new Blob(['content'], { type: 'image/png' });
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = {
        media: 'https://example.com/image.png',
        name: 'my-file (1) [special].png',
      };

      await mediaService.download(params);

      expect(mockLink.download).toBe(params.name);
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle download failure gracefully', async () => {
      const error = new Error('Failed to fetch media');
      mockAxiosInstance.get.mockRejectedValue(error);

      const params = {
        media: 'https://example.com/broken-link.pdf',
        name: 'document.pdf',
      };

      await expect(mediaService.download(params)).rejects.toThrow(
        'Failed to fetch media',
      );

      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockClick).not.toHaveBeenCalled();
    });

    it('should handle empty media URL', async () => {
      const mockBlob = new Blob([''], { type: 'text/plain' });
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = {
        media: '',
        name: 'empty.txt',
      };

      await mediaService.download(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('', {
        responseType: 'blob',
      });
      expect(mockLink.download).toBe('empty.txt');
    });

    it('should handle empty filename', async () => {
      const mockBlob = new Blob(['content'], { type: 'text/plain' });
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const params = {
        media: 'https://example.com/file.txt',
        name: '',
      };

      await mediaService.download(params);

      expect(mockLink.download).toBe('');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('listFromContactAndRoom', () => {
    it('should make a GET request with all provided parameters', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, name: 'image1.jpg', type: 'image' },
            { id: 2, name: 'document.pdf', type: 'document' },
          ],
          count: 2,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        ordering: '-created_on',
        message: 'msg-123',
        contact: 'contact-456',
        room: 'room-789',
        page: 2,
      };

      const result = await mediaService.listFromContactAndRoom(params);

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: params.ordering,
          message: params.message,
          contact: params.contact,
          room: params.room,
          page: params.page,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make a GET request with partial parameters', async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        contact: 'contact-123',
        room: 'room-456',
      };

      const result = await mediaService.listFromContactAndRoom(params);

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: undefined,
          message: undefined,
          contact: params.contact,
          room: params.room,
          page: undefined,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle empty parameters object', async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      http.get.mockResolvedValue(mockResponse);

      const result = await mediaService.listFromContactAndRoom({});

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: undefined,
          message: undefined,
          contact: undefined,
          room: undefined,
          page: undefined,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      http.get.mockRejectedValue(error);

      const params = {
        contact: 'contact-123',
        room: 'room-456',
      };

      await expect(mediaService.listFromContactAndRoom(params)).rejects.toThrow(
        'API Error',
      );
      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: undefined,
          message: undefined,
          contact: params.contact,
          room: params.room,
          page: undefined,
        },
      });
    });

    it('should handle null parameters', async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        ordering: null,
        message: null,
        contact: null,
        room: null,
        page: null,
      };

      const result = await mediaService.listFromContactAndRoom(params);

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: null,
          message: null,
          contact: null,
          room: null,
          page: null,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('listFromContactAndClosedRoom', () => {
    it('should make a GET request with all provided parameters including project', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, name: 'archived-image.jpg', type: 'image' },
            { id: 2, name: 'archived-doc.pdf', type: 'document' },
          ],
          count: 2,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        ordering: 'created_on',
        message: 'msg-987',
        contact: 'contact-654',
        room: 'closed-room-321',
        page: 1,
      };

      const result = await mediaService.listFromContactAndClosedRoom(params);

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: params.ordering,
          message: params.message,
          contact: params.contact,
          room: params.room,
          page: params.page,
          project: 'mocked-project-id',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should always include project parameter even with partial params', async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        room: 'closed-room-123',
      };

      const result = await mediaService.listFromContactAndClosedRoom(params);

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: undefined,
          message: undefined,
          contact: undefined,
          room: params.room,
          page: undefined,
          project: 'mocked-project-id',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle empty parameters but still include project', async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      http.get.mockResolvedValue(mockResponse);

      const result = await mediaService.listFromContactAndClosedRoom({});

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: undefined,
          message: undefined,
          contact: undefined,
          room: undefined,
          page: undefined,
          project: 'mocked-project-id',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors for closed room requests', async () => {
      const error = new Error('Closed room API Error');
      http.get.mockRejectedValue(error);

      const params = {
        contact: 'contact-789',
        room: 'closed-room-456',
      };

      await expect(
        mediaService.listFromContactAndClosedRoom(params),
      ).rejects.toThrow('Closed room API Error');
      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: undefined,
          message: undefined,
          contact: params.contact,
          room: params.room,
          page: undefined,
          project: 'mocked-project-id',
        },
      });
    });

    it('should handle pagination correctly', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 3, name: 'page2-file.jpg' }],
          count: 10,
          next: 'https://api.example.com/media/?page=3',
          previous: 'https://api.example.com/media/?page=1',
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        room: 'closed-room-123',
        page: 2,
      };

      const result = await mediaService.listFromContactAndClosedRoom(params);

      expect(http.get).toHaveBeenCalledWith('/media/', {
        params: {
          ordering: undefined,
          message: undefined,
          contact: undefined,
          room: params.room,
          page: 2,
          project: 'mocked-project-id',
        },
      });
      expect(result).toEqual(mockResponse.data);
      expect(result.next).toBeDefined();
      expect(result.previous).toBeDefined();
    });

    it('should handle different ordering options', async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      http.get.mockResolvedValue(mockResponse);

      const orderingOptions = [
        'created_on',
        '-created_on',
        'name',
        '-name',
        'size',
        '-size',
      ];

      for (const ordering of orderingOptions) {
        http.get.mockClear();

        await mediaService.listFromContactAndClosedRoom({
          ordering,
          room: 'test-room',
        });

        expect(http.get).toHaveBeenCalledWith('/media/', {
          params: {
            ordering,
            message: undefined,
            contact: undefined,
            room: 'test-room',
            page: undefined,
            project: 'mocked-project-id',
          },
        });
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow: list, get, and download', async () => {
      const listResponse = {
        data: {
          results: [
            {
              id: 1,
              url: 'https://example.com/file.pdf',
              name: 'document.pdf',
            },
          ],
        },
      };
      http.get.mockResolvedValue(listResponse);

      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      const mockResponse = { data: mockBlob };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const listResult = await mediaService.listFromContactAndRoom({
        room: 'room-123',
        contact: 'contact-456',
      });

      expect(listResult.results).toHaveLength(1);

      const fileToDownload = listResult.results[0];
      await mediaService.download({
        media: fileToDownload.url,
        name: fileToDownload.name,
      });

      expect(mockClick).toHaveBeenCalled();
      expect(mockLink.download).toBe('document.pdf');
    });

    it('should handle different media types correctly', async () => {
      const mediaTypes = [
        { type: 'image/jpeg', content: 'image data' },
        { type: 'application/pdf', content: 'pdf data' },
        { type: 'video/mp4', content: 'video data' },
        { type: 'audio/mpeg', content: 'audio data' },
        { type: 'text/plain', content: 'text data' },
      ];

      for (const mediaType of mediaTypes) {
        const mockBlob = new Blob([mediaType.content], {
          type: mediaType.type,
        });
        const mockResponse = { data: mockBlob };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await mediaService.get(`https://example.com/file`);
        expect(result).toBe(mockBlob);
        expect(result.type).toBe(mediaType.type);
      }
    });
  });
});
