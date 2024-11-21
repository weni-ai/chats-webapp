import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidJson,
  parseMessageToMessageWithSenderProp,
  isMessageFromCurrentUser,
  getMessages,
  treatMessages,
} from '@/utils/messages';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

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
});
