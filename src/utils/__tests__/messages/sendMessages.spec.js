import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, resendMessage } from '@/utils/messages';
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
      vi.spyOn(console, 'error').mockImplementation(() => {});
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
});
