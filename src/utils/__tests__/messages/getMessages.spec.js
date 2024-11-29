import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMessages } from '@/utils/messages';
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
});
