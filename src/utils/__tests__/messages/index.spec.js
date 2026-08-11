import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidJson,
  parseMessageToMessageWithSenderProp,
  isMessageFromCurrentUser,
  treatMessages,
  createTemporaryMessage,
  sendMessage,
  resendMessage,
} from '@/utils/messages';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

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

    it('should use the provided uuid override when available', () => {
      const result = createTemporaryMessage({
        uuid: 'custom-request-id',
        message: 'Hello',
      });

      expect(result.uuid).toBe('custom-request-id');
      expect(result.text).toBe('Hello');
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
    it('should call addFailedMessage when sendItemMessage rejects', async () => {
      const addFailedMessage = vi.fn();
      const addMessage = vi.fn();
      const addSortedMessage = vi.fn();
      const updateMessage = vi.fn();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await sendMessage({
        itemType: 'room',
        itemUuid: 'room-1',
        itemUser: { email: 'user@example.com' },
        message: 'Hello',
        uuid: 'req-1',
        sendItemMessage: vi.fn().mockRejectedValue(new Error('fail')),
        addMessage,
        addSortedMessage,
        updateMessage,
        addFailedMessage,
      });

      expect(addMessage).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: 'req-1', text: 'Hello' }),
      );
      expect(updateMessage).not.toHaveBeenCalled();
      expect(addFailedMessage).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: 'req-1', text: 'Hello' }),
      );

      errorSpy.mockRestore();
    });

    it('should update the temporary message on success', async () => {
      const addMessage = vi.fn();
      const addSortedMessage = vi.fn();
      const updateMessage = vi.fn();

      await sendMessage({
        itemType: 'room',
        itemUuid: 'room-1',
        itemUser: { email: 'user@example.com' },
        message: 'Hello',
        uuid: 'req-1',
        sendItemMessage: vi
          .fn()
          .mockResolvedValue({ uuid: 'server-1', text: 'Hello' }),
        addMessage,
        addSortedMessage,
        updateMessage,
      });

      expect(updateMessage).toHaveBeenCalledWith({
        message: { uuid: 'server-1', text: 'Hello' },
        toUpdateMessageUuid: 'req-1',
      });
    });
  });

  describe('resendMessage', () => {
    it('should call addFailedMessage when resend fails', async () => {
      const addFailedMessage = vi.fn();
      const updateMessage = vi.fn();
      const removeInPromiseMessage = vi.fn();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const message = { uuid: 'msg-1', text: 'Hello' };

      await resendMessage({
        itemUuid: 'room-1',
        message,
        sendItemMessage: vi.fn().mockRejectedValue(new Error('fail')),
        updateMessage,
        messagesInPromiseUuids: [],
        removeInPromiseMessage,
        addFailedMessage,
      });

      expect(updateMessage).not.toHaveBeenCalled();
      expect(removeInPromiseMessage).toHaveBeenCalledWith('msg-1');
      expect(addFailedMessage).toHaveBeenCalledWith(message);

      errorSpy.mockRestore();
    });
  });
});
