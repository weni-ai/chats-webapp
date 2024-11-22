import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidJson,
  parseMessageToMessageWithSenderProp,
  isMessageFromCurrentUser,
  getMessages,
  treatMessages,
  sendMessage,
  createTemporaryMessage,
  resendMessage,
  sendMedias,
  resendMedia,
  groupMessages,
} from '@/utils/messages';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import moment from 'moment';
import * as UtilsArray from '@/utils/array';

vi.spyOn(global, 'setTimeout').mockImplementation((callback) => callback());

vi.mock('@/store/modules/profile', () => ({
  useProfile: () => ({
    me: { email: 'user@example.com' },
  }),
}));

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

vi.mock('@/store/modules/chats/discussions', () => ({
  useDiscussions: vi.fn(),
}));

describe('Messages utils', () => {
  let roomsStoreMock;
  let discussionsStoreMock;

  beforeEach(() => {
    roomsStoreMock = {
      activeRoom: { uuid: 'active-room-uuid' },
    };

    discussionsStoreMock = {
      activeDiscussion: { uuid: 'active-discussion-uuid' },
    };

    useRooms.mockReturnValue(roomsStoreMock);
    useDiscussions.mockReturnValue(discussionsStoreMock);
  });

  describe('createTemporaryMessage', () => {
    it('should create a temporary message with default values when no arguments are provided', () => {
      const result = createTemporaryMessage({});

      expect(result).toHaveProperty('uuid');
      expect(result.text).toBe('');
      expect(new Date(result.created_on).toISOString()).toBe(result.created_on);
      expect(result.media).toEqual([]);
      expect(result.seen).toBe(true);
      expect(result.user).toEqual({});
    });

    it('should include itemType and itemUuid as a dynamic property in the result', () => {
      const result = createTemporaryMessage({
        itemType: 'chat',
        itemUuid: '12345',
      });

      expect(result).toHaveProperty('chat', '12345');
      expect(result.text).toBe('');
    });

    it('should populate text with the provided message', () => {
      const result = createTemporaryMessage({
        message: 'Test message',
      });

      expect(result.text).toBe('Test message');
    });

    it('should include medias array in the result when provided', () => {
      const medias = ['media1.png', 'media2.png'];
      const result = createTemporaryMessage({
        medias,
      });

      expect(result.media).toEqual(medias);
    });

    it('should include itemUser in the result when provided', () => {
      const itemUser = { id: 1, name: 'John Doe' };
      const result = createTemporaryMessage({
        itemUser,
      });

      expect(result.user).toEqual(itemUser);
    });
  });

  describe('isValidJson', () => {
    it('should return true for valid JSON string', () => {
      const message = JSON.stringify({ key: 'value' });
      expect(isValidJson(message)).toBe(true);
    });

    it('should return false for invalid JSON string', () => {
      const message = '{ key: value }';
      expect(isValidJson(message)).toBe(false);
    });

    it('should return false for non-object JSON values', () => {
      expect(isValidJson('123')).toBe(false);
      expect(isValidJson('"string"')).toBe(false);
    });
  });

  describe('parseMessageToMessageWithSenderProp', () => {
    it('should add sender properties from contact', () => {
      const message = {
        contact: { name: 'John Doe', uuid: '1234' },
      };
      const result = parseMessageToMessageWithSenderProp(message);

      expect(result).toEqual({
        contact: { name: 'John Doe', uuid: '1234' },
        sender: { name: 'John Doe', uuid: '1234' },
      });
    });

    it('should add sender properties from user', () => {
      const message = {
        user: {
          email: 'user@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
        },
      };
      const result = parseMessageToMessageWithSenderProp(message);

      expect(result).toEqual({
        user: {
          email: 'user@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
          name: 'Jane Doe',
          uuid: 'user@example.com',
        },
        sender: {
          email: 'user@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
          name: 'Jane Doe',
          uuid: 'user@example.com',
        },
      });
    });

    it('should return the original message if no sender is found', () => {
      const message = {};
      const result = parseMessageToMessageWithSenderProp(message);
      expect(result).toEqual(message);
    });
  });

  describe('isMessageFromCurrentUser', () => {
    it('should return true if the message is from the current user', () => {
      const message = { user: { email: 'user@example.com' } };
      expect(isMessageFromCurrentUser(message)).toBe(true);
    });

    it('should return false if the message is not from the current user', () => {
      const message = { user: { email: 'anotheruser@example.com' } };
      expect(isMessageFromCurrentUser(message)).toBe(false);
    });

    it('should return false if message user or current user is undefined', () => {
      const message = {};
      expect(isMessageFromCurrentUser(message)).toBe(false);
    });
  });

  describe('getMessages', () => {
    let getItemMessagesMock;

    beforeEach(() => {
      getItemMessagesMock = vi.fn();
    });

    it('should return an empty object if itemUuid is not provided', async () => {
      const result = await getMessages({
        itemUuid: '',
        getItemMessages: getItemMessagesMock,
      });
      expect(result).toEqual({});
      expect(getItemMessagesMock).not.toHaveBeenCalled();
    });

    it('should return early if firstMessage.discussion exists and is different from activeDiscussionUUID', async () => {
      const mockResponse = {
        results: [
          { id: 1, room: 'active-room-uuid', discussion: 'another-discussion' },
        ],
        next: '',
        previous: '',
      };

      getItemMessagesMock.mockResolvedValueOnce(mockResponse);

      const result = await getMessages({
        itemUuid: 'valid-uuid',
        getItemMessages: getItemMessagesMock,
      });

      expect(getItemMessagesMock).toHaveBeenCalledTimes(1);
      expect(result.messages).toEqual([]);
    });

    it('should fetch messages successfully and return the response', async () => {
      const mockResponse = {
        results: [{ id: 1, room: 'active-room-uuid' }],
        next: 'next-url',
        previous: 'previous-url',
      };

      getItemMessagesMock.mockResolvedValueOnce(mockResponse);

      const result = await getMessages({
        itemUuid: 'valid-uuid',
        getItemMessages: getItemMessagesMock,
      });

      expect(result).toEqual({
        messages: mockResponse.results,
        next: mockResponse.next,
        previous: mockResponse.previous,
      });
      expect(getItemMessagesMock).toHaveBeenCalledTimes(1);
    });

    it('should skip processing if the first message room does not match active room', async () => {
      const mockResponse = {
        results: [{ id: 1, room: 'different-room-uuid' }],
        next: 'next-url',
        previous: 'previous-url',
      };

      getItemMessagesMock.mockResolvedValueOnce(mockResponse);

      const result = await getMessages({
        itemUuid: 'valid-uuid',
        getItemMessages: getItemMessagesMock,
      });

      expect(result).toEqual({ messages: [], next: '', previous: '' });
      expect(getItemMessagesMock).toHaveBeenCalledTimes(1);
    });

    it('should retry up to maxRetries times on failure', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      getItemMessagesMock
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          results: [{ id: 1, room: 'active-room-uuid' }],
          next: 'next-url',
          previous: 'previous-url',
        });

      const result = await getMessages({
        itemUuid: 'valid-uuid',
        getItemMessages: getItemMessagesMock,
      });

      expect(result).toEqual({
        messages: [{ id: 1, room: 'active-room-uuid' }],
        next: 'next-url',
        previous: 'previous-url',
      });
      expect(getItemMessagesMock).toHaveBeenCalledTimes(3);
    });

    it('should throw an error after exceeding maxRetries', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      getItemMessagesMock.mockRejectedValue(new Error('Network Error'));

      await expect(
        getMessages({
          itemUuid: 'valid-uuid',
          getItemMessages: getItemMessagesMock,
        }),
      ).rejects.toThrowError(
        'Several errors occurred when trying to request messages from the room. There will be no automatic retries.',
      );

      expect(getItemMessagesMock).toHaveBeenCalledTimes(4);
    });
  });

  describe('treatMessages', () => {
    let mockGetItemMessages = vi.fn().mockResolvedValueOnce({
      results: [],
      next: '',
      previous: '',
    });
    let mockAddSortedMessage = vi.fn();
    let mockResetSortedMessages = vi.fn();
    let mockSetMessages = vi.fn();
    let mockSetMessagesNext = vi.fn();
    let mockSetMessagesPrevious = vi.fn();

    const defaultParams = {
      itemUuid: '123',
      getItemMessages: mockGetItemMessages,
      oldMessages: [],
      nextReq: '',
      addSortedMessage: mockAddSortedMessage,
      resetSortedMessages: mockResetSortedMessages,
      setMessages: mockSetMessages,
      setMessagesNext: mockSetMessagesNext,
      setMessagesPrevious: mockSetMessagesPrevious,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should handle empty messages and do nothing', async () => {
      await treatMessages(defaultParams);

      expect(mockResetSortedMessages).not.toHaveBeenCalled();
      expect(mockAddSortedMessage).not.toHaveBeenCalled();
      expect(mockSetMessages).not.toHaveBeenCalled();
      expect(mockSetMessagesNext).not.toHaveBeenCalled();
      expect(mockSetMessagesPrevious).not.toHaveBeenCalled();
    });

    it('should fetch and set messages correctly without nextReq', async () => {
      const mockMessages = [{ id: 1 }, { id: 2 }];

      await treatMessages({
        ...defaultParams,
        getItemMessages: vi.fn().mockResolvedValueOnce({
          results: mockMessages,
          next: 'next-token',
          previous: 'previous-token',
        }),
      });

      expect(mockResetSortedMessages).toHaveBeenCalled();
      expect(mockAddSortedMessage).toHaveBeenCalledTimes(mockMessages.length);
      mockMessages.forEach((message) =>
        expect(mockAddSortedMessage).toHaveBeenCalledWith({ message }),
      );
      expect(mockSetMessages).toHaveBeenCalledWith(mockMessages);
      expect(mockSetMessagesNext).toHaveBeenCalledWith('next-token');
      expect(mockSetMessagesPrevious).toHaveBeenCalledWith('previous-token');
    });

    it('should handle messages correctly with nextReq', async () => {
      const mockMessages = [{ id: 3 }, { id: 4 }];
      const oldMessages = [{ id: 1 }, { id: 2 }];

      await treatMessages({
        ...defaultParams,
        getItemMessages: vi.fn().mockResolvedValueOnce({
          results: mockMessages,
          next: 'next-token',
          previous: 'previous-token',
        }),
        oldMessages,
        nextReq: true,
      });

      mockMessages.forEach((message) =>
        expect(mockAddSortedMessage).toHaveBeenCalledWith({
          message,
          addBefore: true,
        }),
      );
      expect(mockSetMessages).toHaveBeenCalledWith([
        ...mockMessages,
        ...oldMessages,
      ]);
      expect(mockSetMessagesNext).toHaveBeenCalledWith('next-token');
      expect(mockSetMessagesPrevious).toHaveBeenCalledWith('previous-token');
    });
  });

  describe('sendMessage', () => {
    const mockAddMessage = vi.fn();
    const mockAddSortedMessage = vi.fn();
    const mockUpdateMessage = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return early if itemUuid is not provided', async () => {
      await sendMessage({
        itemType: 'type1',
        itemUuid: null,
        itemUser: 'user1',
        message: 'Test message',
        sendItemMessage: vi.fn(),
        addMessage: mockAddMessage,
        addSortedMessage: mockAddSortedMessage,
        updateMessage: mockUpdateMessage,
      });

      expect(mockAddMessage).not.toHaveBeenCalled();
      expect(mockAddSortedMessage).not.toHaveBeenCalled();
      expect(mockUpdateMessage).not.toHaveBeenCalled();
    });

    it('should add temporary message and call sendItemMessage', async () => {
      const mockSendItemMessage = vi.fn().mockResolvedValue({
        uuid: 'real-message-uuid',
        content: 'Real message content',
      });

      await sendMessage({
        itemType: 'type1',
        itemUuid: 'uuid1',
        itemUser: 'user1',
        message: 'Test message',
        sendItemMessage: mockSendItemMessage,
        addMessage: mockAddMessage,
        addSortedMessage: mockAddSortedMessage,
        updateMessage: mockUpdateMessage,
      });

      const expectedMessage = {
        uuid: expect.any(String),
        type1: 'uuid1',
        user: 'user1',
        text: 'Test message',
        media: [],
        seen: true,
        created_on: expect.any(String),
      };

      expect(mockAddMessage).toHaveBeenCalledWith(expectedMessage);
      expect(mockAddSortedMessage).toHaveBeenCalledWith(expectedMessage);
      expect(mockSendItemMessage).toHaveBeenCalled();
      expect(mockUpdateMessage).toHaveBeenCalledWith({
        message: {
          uuid: 'real-message-uuid',
          content: 'Real message content',
        },
        toUpdateMessageUuid: expect.any(String),
      });
    });

    it('should handle errors in sendItemMessage gracefully', async () => {
      const mockSendItemMessage = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      await sendMessage({
        itemType: 'type1',
        itemUuid: 'uuid1',
        itemUser: 'user1',
        message: 'Test message',
        sendItemMessage: mockSendItemMessage,
        addMessage: mockAddMessage,
        addSortedMessage: mockAddSortedMessage,
        updateMessage: mockUpdateMessage,
      });

      expect(mockSendItemMessage).toHaveBeenCalled();
      expect(mockUpdateMessage).not.toHaveBeenCalled();
    });
  });

  describe('resendMessage', () => {
    let mockSendItemMessage;
    let mockUpdateMessage;
    let mockRemoveInPromiseMessage;
    let messagesInPromiseUuids;

    beforeEach(() => {
      mockSendItemMessage = vi.fn();
      mockUpdateMessage = vi.fn();
      mockRemoveInPromiseMessage = vi.fn();
      messagesInPromiseUuids = [];
    });

    it('should return early if itemUuid is not provided', async () => {
      await resendMessage({
        itemUuid: null,
        message: { uuid: 'message-1' },
        sendItemMessage: mockSendItemMessage,
        updateMessage: mockUpdateMessage,
        messagesInPromiseUuids,
        removeInPromiseMessage: mockRemoveInPromiseMessage,
      });

      expect(mockSendItemMessage).not.toHaveBeenCalled();
      expect(mockUpdateMessage).not.toHaveBeenCalled();
      expect(mockRemoveInPromiseMessage).not.toHaveBeenCalled();
      expect(messagesInPromiseUuids).toHaveLength(0);
    });

    it('should return early if message UUID is already in messagesInPromiseUuids', async () => {
      messagesInPromiseUuids.push('message-1');

      await resendMessage({
        itemUuid: 'item-1',
        message: { uuid: 'message-1' },
        sendItemMessage: mockSendItemMessage,
        updateMessage: mockUpdateMessage,
        messagesInPromiseUuids,
        removeInPromiseMessage: mockRemoveInPromiseMessage,
      });

      expect(mockSendItemMessage).not.toHaveBeenCalled();
      expect(mockUpdateMessage).not.toHaveBeenCalled();
      expect(mockRemoveInPromiseMessage).not.toHaveBeenCalled();
    });

    it('should send the message and update it on success', async () => {
      const updatedMessage = {
        uuid: 'updated-message-1',
        content: 'Updated content',
      };
      mockSendItemMessage.mockResolvedValue(updatedMessage);

      await resendMessage({
        itemUuid: 'item-1',
        message: { uuid: 'message-1' },
        sendItemMessage: mockSendItemMessage,
        updateMessage: mockUpdateMessage,
        messagesInPromiseUuids,
        removeInPromiseMessage: mockRemoveInPromiseMessage,
      });

      expect(messagesInPromiseUuids).toContain('message-1');
      expect(mockSendItemMessage).toHaveBeenCalled();
      expect(mockRemoveInPromiseMessage).toHaveBeenCalledWith('message-1');
      expect(mockUpdateMessage).toHaveBeenCalledWith({
        message: updatedMessage,
        toUpdateMessageUuid: 'message-1',
      });
    });

    it('should remove the message UUID from messagesInPromiseUuids and log an error on failure', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Network error');
      mockSendItemMessage.mockRejectedValue(error);

      await resendMessage({
        itemUuid: 'item-1',
        message: { uuid: 'message-1' },
        sendItemMessage: mockSendItemMessage,
        updateMessage: mockUpdateMessage,
        messagesInPromiseUuids,
        removeInPromiseMessage: mockRemoveInPromiseMessage,
      });

      expect(messagesInPromiseUuids).toContain('message-1');
      expect(mockSendItemMessage).toHaveBeenCalled();
      expect(mockRemoveInPromiseMessage).toHaveBeenCalledWith('message-1');
      expect(mockUpdateMessage).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'An error occurred while sending the message',
        error,
      );

      consoleErrorSpy.mockRestore();
    });

    it('should ensure the UUID is removed from messagesInPromiseUuids after success', async () => {
      const updatedMessage = {
        uuid: 'updated-message-1',
        content: 'Updated content',
      };
      mockSendItemMessage.mockResolvedValue(updatedMessage);

      await resendMessage({
        itemUuid: 'item-1',
        message: { uuid: 'message-1' },
        sendItemMessage: mockSendItemMessage,
        updateMessage: mockUpdateMessage,
        messagesInPromiseUuids,
        removeInPromiseMessage: mockRemoveInPromiseMessage,
      });

      expect(messagesInPromiseUuids).toContain('message-1');
      expect(mockRemoveInPromiseMessage).toHaveBeenCalledWith('message-1');
      expect(mockUpdateMessage).toHaveBeenCalled();
    });
  });

  describe('sendMedias', () => {
    let mockSendItemMedia;
    let mockAddMessage;
    let mockAddFailedMessage;
    let mockAddSortedMessage;
    let mockUpdateMessage;

    beforeEach(() => {
      mockSendItemMedia = vi.fn();
      mockAddMessage = vi.fn();
      mockAddFailedMessage = vi.fn();
      mockAddSortedMessage = vi.fn();
      mockUpdateMessage = vi.fn();
      vi.clearAllMocks();

      window.URL.createObjectURL = () => 'url';
    });

    it('should return early if itemUuid is not provided', async () => {
      await sendMedias({
        itemType: 'type1',
        itemUuid: null,
        itemUser: 'user1',
        medias: [],
        sendItemMedia: mockSendItemMedia,
        addMessage: mockAddMessage,
        addFailedMessage: mockAddFailedMessage,
        addSortedMessage: mockAddSortedMessage,
        updateMessage: mockUpdateMessage,
      });

      expect(mockAddMessage).not.toHaveBeenCalled();
      expect(mockSendItemMedia).not.toHaveBeenCalled();
    });

    it('should process and send multiple media files successfully', async () => {
      const media1 = new File(['content1'], 'file1.jpg', {
        type: 'image/jpeg',
      });
      const media2 = new File(['content2'], 'file2.png', { type: 'image/png' });

      const sentMedia1 = { url: 'url1', type: 'image/jpeg' };
      const sentMedia2 = { url: 'url2', type: 'image/png' };

      mockSendItemMedia
        .mockResolvedValueOnce(sentMedia1)
        .mockResolvedValueOnce(sentMedia2);

      await sendMedias({
        itemType: 'type1',
        itemUuid: 'uuid1',
        itemUser: 'user1',
        medias: [media1, media2],
        sendItemMedia: mockSendItemMedia,
        addMessage: mockAddMessage,
        addFailedMessage: mockAddFailedMessage,
        addSortedMessage: mockAddSortedMessage,
        updateMessage: mockUpdateMessage,
      });

      const expectedMessage = {
        uuid: expect.any(String),
        type1: 'uuid1',
        user: 'user1',
        text: '',
        media: [
          {
            preview: 'url',
            file: expect.any(File),
            content_type: 'image/png',
          },
        ],
        seen: true,
        created_on: expect.any(String),
      };

      // Verify temporary messages were created and added
      expect(mockAddMessage).toHaveBeenNthCalledWith(2, expectedMessage);
      expect(mockAddSortedMessage).toHaveBeenNthCalledWith(2, expectedMessage);

      // Verify media files were sent
      expect(mockSendItemMedia).toHaveBeenCalledWith(media1);
      expect(mockSendItemMedia).toHaveBeenCalledWith(media2);

      // Verify messages were updated with the actual media data
      expect(mockUpdateMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when sending media', async () => {
      const media1 = new File(['content1'], 'file1.jpg', {
        type: 'image/jpeg',
      });
      const media2 = new File(['content2'], 'file2.png', { type: 'image/png' });

      mockSendItemMedia
        .mockRejectedValueOnce(new Error('Error sending media1'))
        .mockRejectedValueOnce(new Error('Error sending media2'));

      await sendMedias({
        itemType: 'type1',
        itemUuid: 'uuid1',
        itemUser: { id: 1 },
        medias: [media1, media2],
        sendItemMedia: mockSendItemMedia,
        addMessage: mockAddMessage,
        addFailedMessage: mockAddFailedMessage,
        addSortedMessage: mockAddSortedMessage,
        updateMessage: mockUpdateMessage,
      });

      expect(mockAddFailedMessage).toHaveBeenCalledTimes(2);
      expect(mockUpdateMessage).not.toHaveBeenCalled();
    });
  });

  describe('resendMedia', () => {
    let mockSendItemMedia;
    let mockAddFailedMessage;
    let mockRemoveFailedMessage;
    let mockAddSendingMessage;
    let mockUpdateMessage;

    beforeEach(() => {
      mockSendItemMedia = vi.fn();
      mockAddFailedMessage = vi.fn();
      mockRemoveFailedMessage = vi.fn();
      mockAddSendingMessage = vi.fn();
      mockUpdateMessage = vi.fn();
      vi.clearAllMocks();
    });

    it('should return early if itemUuid is not provided', async () => {
      await resendMedia({
        itemUuid: null,
        sendItemMedia: mockSendItemMedia,
        addFailedMessage: mockAddFailedMessage,
        removeFailedMessage: mockRemoveFailedMessage,
        addSendingMessage: mockAddSendingMessage,
        updateMessage: mockUpdateMessage,
        message: { uuid: 'msg-uuid' },
        media: { preview: 'preview-url', file: new File([], 'file.jpg') },
      });

      expect(mockSendItemMedia).not.toHaveBeenCalled();
      expect(mockRemoveFailedMessage).not.toHaveBeenCalled();
      expect(mockAddSendingMessage).not.toHaveBeenCalled();
    });

    it('should handle resending media from the current user successfully', async () => {
      const message = {
        uuid: 'msg-uuid',
        preview: 'preview-url',
        user: {
          email: 'user@example.com',
        },
      };
      const media = { preview: 'preview-url', file: new File([], 'file.jpg') };
      const updatedMedia = { url: 'updated-url', type: 'image/jpeg' };

      mockSendItemMedia.mockResolvedValue(updatedMedia);

      await resendMedia({
        itemUuid: 'item-uuid',
        sendItemMedia: mockSendItemMedia,
        addFailedMessage: mockAddFailedMessage,
        removeFailedMessage: mockRemoveFailedMessage,
        addSendingMessage: mockAddSendingMessage,
        updateMessage: mockUpdateMessage,
        message,
        media,
      });

      // Verify message is marked as sending
      expect(mockRemoveFailedMessage).toHaveBeenCalledWith('msg-uuid');
      expect(mockAddSendingMessage).toHaveBeenCalledWith('msg-uuid');

      // Verify media was sent
      expect(mockSendItemMedia).toHaveBeenCalledWith(media);

      // Verify message was updated
      expect(mockUpdateMessage).toHaveBeenCalledWith({
        media: updatedMedia,
        message,
        toUpdateMediaPreview: 'preview-url',
        toUpdateMessageUuid: 'msg-uuid',
      });
    });

    it('should not mark message as sending if it is not from the current user', async () => {
      const message = {
        uuid: 'msg-uuid',
        preview: 'preview-url',
        user: {
          email: 'anotheruser@example.com',
        },
      };
      const media = { preview: 'preview-url', file: new File([], 'file.jpg') };
      const updatedMedia = { url: 'updated-url', type: 'image/jpeg' };

      mockSendItemMedia.mockResolvedValue(updatedMedia);

      await resendMedia({
        itemUuid: 'item-uuid',
        sendItemMedia: mockSendItemMedia,
        addFailedMessage: mockAddFailedMessage,
        removeFailedMessage: mockRemoveFailedMessage,
        addSendingMessage: mockAddSendingMessage,
        updateMessage: mockUpdateMessage,
        message,
        media,
      });

      // Verify message is not marked as sending
      expect(mockRemoveFailedMessage).not.toHaveBeenCalled();
      expect(mockAddSendingMessage).not.toHaveBeenCalled();

      // Verify media was sent
      expect(mockSendItemMedia).toHaveBeenCalledWith(media);

      // Verify message was updated
      expect(mockUpdateMessage).toHaveBeenCalledWith({
        media: updatedMedia,
        message,
        toUpdateMediaPreview: 'preview-url',
        toUpdateMessageUuid: 'msg-uuid',
      });
    });

    it('should handle errors during media resend', async () => {
      const message = {
        uuid: 'msg-uuid',
        preview: 'preview-url',
        user: {
          email: 'user@example.com',
        },
      };
      const media = { preview: 'preview-url', file: new File([], 'file.jpg') };

      mockSendItemMedia.mockRejectedValue(new Error('Failed to send media'));

      await resendMedia({
        itemUuid: 'item-uuid',
        sendItemMedia: mockSendItemMedia,
        addFailedMessage: mockAddFailedMessage,
        removeFailedMessage: mockRemoveFailedMessage,
        addSendingMessage: mockAddSendingMessage,
        updateMessage: mockUpdateMessage,
        message,
        media,
      });

      // Verify message was marked as failed again
      expect(mockRemoveFailedMessage).toHaveBeenCalledWith('msg-uuid');
      expect(mockAddFailedMessage).toHaveBeenCalledWith(message);

      // Verify media was not updated
      expect(mockUpdateMessage).not.toHaveBeenCalled();
    });
  });

  describe('groupMessages', () => {
    let messagesReference;

    beforeEach(() => {
      messagesReference = [];
      vi.clearAllMocks();
    });

    it('should add a new message to a new date group', () => {
      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'Test message',
      };

      groupMessages(messagesReference, { message, addBefore: false });

      expect(messagesReference).toEqual([
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [message],
            },
          ],
        },
      ]);
    });

    it('should add a message to an existing date group but a new minute group', () => {
      messagesReference = [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [{ content: 'Existing message' }],
            },
          ],
        },
      ];

      const message = {
        created_on: moment('2024-01-01T10:31:00').toISOString(),
        content: 'New message',
      };

      groupMessages(messagesReference, { message, addBefore: false });

      expect(messagesReference).toEqual([
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [{ content: 'Existing message' }],
            },
            {
              minute: '10:31',
              messages: [message],
            },
          ],
        },
      ]);
    });

    it('should add a message to an existing minute group', async () => {
      messagesReference = [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [{ content: 'Existing message' }],
            },
          ],
        },
      ];

      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'New message',
      };

      groupMessages(messagesReference, { message, addBefore: false });

      setTimeout(() => {
        expect(messagesReference).toEqual([
          {
            date: '01/01/2024',
            minutes: [
              {
                minute: '10:30',
                messages: [
                  { content: 'Existing message' },
                  {
                    created_on: expect.any(String),
                    content: 'New message',
                  },
                ],
              },
            ],
          },
        ]);
      }, 1000);
    });

    it('should add a message at the beginning of an existing minute group if addBefore is true', () => {
      messagesReference = [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [{ content: 'Existing message' }],
            },
          ],
        },
      ];

      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'New message',
      };

      groupMessages(messagesReference, { message, addBefore: true });

      setTimeout(() => {
        expect(messagesReference).toEqual([
          {
            date: '01/01/2024',
            minutes: [
              {
                minute: '10:30',
                messages: [
                  { content: 'New message' },
                  {
                    content: 'Existing message',
                    created_on: expect.any(String),
                  },
                ],
              },
            ],
          },
        ]);
      }, 1000);
    });

    it('should create a new date group if the date does not exist', () => {
      messagesReference = [
        {
          date: '11/20/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [{ content: 'Old message' }],
            },
          ],
        },
      ];

      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'New message',
      };

      groupMessages(messagesReference, { message, addBefore: false });

      expect(messagesReference).toEqual([
        {
          date: '11/20/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [{ content: 'Old message' }],
            },
          ],
        },
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [message],
            },
          ],
        },
      ]);
    });

    it('should remove duplicate messages in the same minute group', () => {
      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'Duplicate message',
      };

      const removeDuplicatedItemsSpy = vi.spyOn(
        UtilsArray,
        'removeDuplicatedItems',
      );

      messagesReference = [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [message],
            },
          ],
        },
      ];

      groupMessages(messagesReference, { message, addBefore: false });

      expect(messagesReference).toEqual([
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [message],
            },
          ],
        },
      ]);
      expect(removeDuplicatedItemsSpy).toHaveBeenCalled();
    });
  });
});
