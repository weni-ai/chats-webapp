import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import messageService from '../message';
import http from '@/services/api/http';
import { useFeatureFlag } from '@/store/modules/featureFlag';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    postForm: vi.fn(),
    defaults: {
      baseURL: 'https://api.example.com/v1',
    },
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'mocked-project-id'),
}));

vi.mock('@/store/modules/featureFlag', () => ({
  useFeatureFlag: vi.fn(() => ({
    featureFlags: {
      active_features: [],
    },
  })),
}));

describe('Message service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeatureFlag.mockReturnValue({
      featureFlags: {
        active_features: [],
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getByRoom', () => {
    it('should fetch messages by room with basic parameters', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, text: 'Hello', created_on: '2023-01-01T10:00:00Z' },
            { id: 2, text: 'World', created_on: '2023-01-01T11:00:00Z' },
          ],
          count: 2,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = { nextReq: null };
      const result = await messageService.getByRoom(params, 'room-123');

      expect(http.get).toHaveBeenCalledWith('/msg/', {
        params: {
          room: 'room-123',
          ordering: '-created_on',
          reverse_results: true,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch messages using nextReq URL when provided', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 3, text: 'Next page', created_on: '2023-01-01T12:00:00Z' },
          ],
          count: 1,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        nextReq:
          'https://api.example.com/msg/?offset=20&limit=20&room=room-123',
      };
      const result = await messageService.getByRoom(params, 'room-123', 0, 20);

      expect(http.get).toHaveBeenCalledWith(
        '/msg/?offset=20&limit=20&room=room-123',
        {},
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Room not found');
      http.get.mockRejectedValue(error);

      const params = { nextReq: null };
      await expect(
        messageService.getByRoom(params, 'invalid-room', 0, 20),
      ).rejects.toThrow('Room not found');
    });

    it('should use v2 API when feature flag is active', async () => {
      useFeatureFlag.mockReturnValue({
        featureFlags: {
          active_features: ['weniChatsV2Message'],
        },
      });

      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'v2 message' }],
          count: 1,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = { nextReq: null };
      await messageService.getByRoom(params, 'room-123');

      expect(http.get).toHaveBeenCalledWith('/msg/', {
        params: {
          room: 'room-123',
          ordering: '-created_on',
          reverse_results: true,
        },
        baseURL: 'https://api.example.com/v2',
      });
    });

    it('should use v1 API when feature flag is not active', async () => {
      useFeatureFlag.mockReturnValue({
        featureFlags: {
          active_features: [],
        },
      });

      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'v1 message' }],
          count: 1,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = { nextReq: null };
      await messageService.getByRoom(params, 'room-123');

      expect(http.get).toHaveBeenCalledWith('/msg/', {
        params: {
          room: 'room-123',
          ordering: '-created_on',
          reverse_results: true,
        },
      });
    });

    it('should use v1 API when featureFlags is undefined', async () => {
      useFeatureFlag.mockReturnValue({
        featureFlags: undefined,
      });

      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'v1 message' }],
          count: 1,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = { nextReq: null };
      await messageService.getByRoom(params, 'room-123');

      expect(http.get).toHaveBeenCalledWith('/msg/', {
        params: {
          room: 'room-123',
          ordering: '-created_on',
          reverse_results: true,
        },
      });
    });
  });

  describe('getByDiscussion', () => {
    it('should fetch messages by discussion with basic parameters', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              text: 'Discussion message',
              created_on: '2023-01-01T10:00:00Z',
            },
          ],
          count: 1,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const params = { nextReq: null };
      const result = await messageService.getByDiscussion(
        params,
        'discussion-456',
        0,
        10,
      );

      expect(http.get).toHaveBeenCalledWith(
        'discussion/discussion-456/list_messages/',
        {
          params: {
            ordering: '-created_on',
            reverse_results: true,
            offset: 0,
            limit: 10,
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch messages using nextReq URL for discussions', async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      http.get.mockResolvedValue(mockResponse);

      const params = {
        nextReq:
          'https://api.example.com/discussion/discussion-456/list_messages/?offset=10&limit=10',
      };
      const result = await messageService.getByDiscussion(
        params,
        'discussion-456',
        0,
        10,
      );

      expect(http.get).toHaveBeenCalledWith(
        'discussion/discussion-456/list_messages/?offset=10&limit=10',
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getByContact', () => {
    it('should fetch messages by contact with default parameters', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'Contact message', contact: 'contact-123' }],
          count: 1,
        },
      };
      http.get.mockResolvedValue(mockResponse);

      const result = await messageService.getByContact('contact-123', 0, 15);

      expect(http.get).toHaveBeenCalledWith('/msg/', {
        params: {
          ordering: '-created_on',
          reverse_results: true,
          contact: 'contact-123',
          project: 'mocked-project-id',
          is_active: false,
          offset: 0,
          limit: 15,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch messages from active rooms when onlyClosedRooms is false', async () => {
      const mockResponse = { data: { results: [], count: 0 } };
      http.get.mockResolvedValue(mockResponse);

      const result = await messageService.getByContact('contact-456', 10, 25, {
        onlyClosedRooms: false,
      });

      expect(http.get).toHaveBeenCalledWith('/msg/', {
        params: {
          ordering: '-created_on',
          reverse_results: true,
          contact: 'contact-456',
          project: 'mocked-project-id',
          is_active: true,
          offset: 10,
          limit: 25,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('sendRoomMessage', () => {
    it('should send a text message to a room with all parameters', async () => {
      const mockResponse = {
        data: {
          id: 123,
          text: 'Hello World',
          user_email: 'user@example.com',
          seen: true,
          room: 'room-123',
          replied_message_id: 'msg-456',
        },
      };
      http.post.mockResolvedValue(mockResponse);

      const messageData = {
        text: 'Hello World',
        user_email: 'user@example.com',
        seen: true,
        repliedMessageId: 'msg-456',
      };

      const result = await messageService.sendRoomMessage(
        'room-123',
        messageData,
      );

      expect(http.post).toHaveBeenCalledWith('/msg/', {
        room: 'room-123',
        text: 'Hello World',
        user_email: 'user@example.com',
        seen: true,
        replied_message_id: 'msg-456',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should send a message with minimal parameters', async () => {
      const mockResponse = {
        data: {
          id: 124,
          text: 'Simple message',
          room: 'room-456',
        },
      };
      http.post.mockResolvedValue(mockResponse);

      const messageData = { text: 'Simple message' };
      const result = await messageService.sendRoomMessage(
        'room-456',
        messageData,
      );

      expect(http.post).toHaveBeenCalledWith('/msg/', {
        room: 'room-456',
        text: 'Simple message',
        user_email: undefined,
        seen: undefined,
        replied_message_id: undefined,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('sendDiscussionMessage', () => {
    it('should send a text message to a discussion', async () => {
      const mockResponse = {
        data: {
          id: 126,
          text: 'Discussion message',
          discussion: 'discussion-123',
        },
      };
      http.post.mockResolvedValue(mockResponse);

      const messageData = { text: 'Discussion message' };
      const result = await messageService.sendDiscussionMessage(
        'discussion-123',
        messageData,
      );

      expect(http.post).toHaveBeenCalledWith(
        '/discussion/discussion-123/send_messages/',
        {
          text: 'Discussion message',
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('sendRoomMedia', () => {
    it('should send media to a room with all parameters', async () => {
      const mockMessageResponse = {
        data: { uuid: 'msg-uuid-123', text: '', room: 'room-123' },
      };
      const mockMediaResponse = {
        data: { id: 456, media_file: 'file.jpg', message: 'msg-uuid-123' },
      };

      http.post.mockResolvedValueOnce(mockMessageResponse);
      http.postForm.mockResolvedValue(mockMediaResponse);

      const updateLoadingFiles = vi.fn();
      const mediaFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const mediaData = {
        user_email: 'user@example.com',
        media: mediaFile,
        updateLoadingFiles,
        repliedMessageId: 'replied-msg-123',
      };

      const result = await messageService.sendRoomMedia('room-123', mediaData);

      expect(http.post).toHaveBeenCalledWith('/msg/', {
        room: 'room-123',
        text: '',
        user_email: 'user@example.com',
        seen: true,
      });

      expect(updateLoadingFiles).toHaveBeenCalledWith('msg-uuid-123', 0);

      expect(http.postForm).toHaveBeenCalledWith(
        '/media/',
        {
          content_type: 'image/jpeg',
          message: 'msg-uuid-123',
          media_file: mediaFile,
          replied_message_id: 'replied-msg-123',
        },
        {
          onUploadProgress: expect.any(Function),
        },
      );

      expect(result).toEqual({
        message_response: mockMessageResponse.data,
        media_response: mockMediaResponse.data,
      });
    });

    it('should handle progress updates during media upload', async () => {
      const mockMessageResponse = {
        data: { uuid: 'msg-uuid-456', text: '', room: 'room-456' },
      };
      const mockMediaResponse = {
        data: { id: 457, media_file: 'document.pdf' },
      };

      http.post.mockResolvedValue(mockMessageResponse);
      http.postForm.mockImplementation((url, data, config) => {
        const event = { loaded: 50, total: 100 };
        config.onUploadProgress(event);
        return Promise.resolve(mockMediaResponse);
      });

      const updateLoadingFiles = vi.fn();
      const mediaFile = new File(['pdf content'], 'doc.pdf', {
        type: 'application/pdf',
      });

      const mediaData = {
        user_email: 'user@example.com',
        media: mediaFile,
        updateLoadingFiles,
      };

      await messageService.sendRoomMedia('room-456', mediaData);

      expect(updateLoadingFiles).toHaveBeenCalledWith('msg-uuid-456', 0);
      expect(updateLoadingFiles).toHaveBeenCalledWith('msg-uuid-456', 0.5);
    });

    it('should handle media upload without updateLoadingFiles callback', async () => {
      const mockMessageResponse = {
        data: { uuid: 'msg-uuid-789', text: '', room: 'room-789' },
      };
      const mockMediaResponse = {
        data: { id: 458, media_file: 'image.png' },
      };

      http.post.mockResolvedValue(mockMessageResponse);
      http.postForm.mockResolvedValue(mockMediaResponse);

      const mediaFile = new File(['image'], 'image.png', { type: 'image/png' });
      const mediaData = {
        user_email: 'user@example.com',
        media: mediaFile,
      };

      const result = await messageService.sendRoomMedia('room-789', mediaData);

      expect(result).toEqual({
        message_response: mockMessageResponse.data,
        media_response: mockMediaResponse.data,
      });
    });

    it('should handle errors during message creation', async () => {
      const error = new Error('Message creation failed');
      http.post.mockRejectedValue(error);

      const mediaFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const mediaData = {
        user_email: 'user@example.com',
        media: mediaFile,
      };

      await expect(
        messageService.sendRoomMedia('room-123', mediaData),
      ).rejects.toThrow('Message creation failed');

      expect(http.postForm).not.toHaveBeenCalled();
    });

    it('should handle errors during media upload', async () => {
      const mockMessageResponse = {
        data: { uuid: 'msg-uuid-error', text: '', room: 'room-error' },
      };
      http.post.mockResolvedValue(mockMessageResponse);

      const error = new Error('Media upload failed');
      http.postForm.mockRejectedValue(error);

      const mediaFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const mediaData = {
        user_email: 'user@example.com',
        media: mediaFile,
      };

      await expect(
        messageService.sendRoomMedia('room-error', mediaData),
      ).rejects.toThrow('Media upload failed');
    });
  });

  describe('sendDiscussionMedia', () => {
    it('should send media to a discussion with progress tracking', async () => {
      const mockResponse = {
        data: {
          media: [
            {
              id: 459,
              media_file: 'discussion-file.jpg',
              content_type: 'image/jpeg',
            },
          ],
        },
      };

      http.postForm.mockImplementation((url, data, config) => {
        const event = { loaded: 75, total: 100 };
        config.onUploadProgress(event);
        return Promise.resolve(mockResponse);
      });

      const updateLoadingFiles = vi.fn();
      const mediaFile = new File(['image data'], 'discussion.jpg', {
        type: 'image/jpeg',
      });

      const mediaData = {
        media: mediaFile,
        updateLoadingFiles,
      };

      const result = await messageService.sendDiscussionMedia(
        'discussion-789',
        mediaData,
      );

      expect(updateLoadingFiles).toHaveBeenCalledWith(
        expect.stringContaining('discussion.jpg'),
        0,
      );
      expect(updateLoadingFiles).toHaveBeenCalledWith(
        expect.stringContaining('discussion.jpg'),
        0.75,
      );

      expect(http.postForm).toHaveBeenCalledWith(
        '/discussion/discussion-789/send_media_messages/',
        {
          content_type: 'image/jpeg',
          text: '',
          media_file: mediaFile,
        },
        {
          onUploadProgress: expect.any(Function),
        },
      );

      expect(result).toEqual(mockResponse.data.media[0]);
    });

    it('should handle discussion media upload without updateLoadingFiles', async () => {
      const mockResponse = {
        data: {
          media: [
            { id: 460, media_file: 'video.mp4', content_type: 'video/mp4' },
          ],
        },
      };

      http.postForm.mockResolvedValue(mockResponse);

      const mediaFile = new File(['video data'], 'video.mp4', {
        type: 'video/mp4',
      });
      const mediaData = { media: mediaFile };

      const result = await messageService.sendDiscussionMedia(
        'discussion-456',
        mediaData,
      );

      expect(result).toEqual(mockResponse.data.media[0]);
    });

    it('should handle empty media array in response', async () => {
      const mockResponse = {
        data: {
          media: [],
        },
      };

      http.postForm.mockResolvedValue(mockResponse);

      const mediaFile = new File(['data'], 'empty.txt', { type: 'text/plain' });
      const mediaData = { media: mediaFile };

      const result = await messageService.sendDiscussionMedia(
        'discussion-123',
        mediaData,
      );

      expect(result).toBeUndefined();
    });
  });
});
