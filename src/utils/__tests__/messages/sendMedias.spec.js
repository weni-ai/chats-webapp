import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMedias, sendMediasWithText, resendMedia } from '@/utils/messages';
import { useRooms } from '@/store/modules/chats/rooms';

vi.mock('@/store/modules/profile', () => ({
  useProfile: () => ({
    me: { email: 'user@example.com' },
  }),
}));

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

describe('Messages utils', () => {
  let roomsStoreMock;

  beforeEach(() => {
    roomsStoreMock = {
      activeRoom: { uuid: 'active-room-uuid' },
    };

    useRooms.mockReturnValue(roomsStoreMock);
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

      const sentMessage1 = {
        uuid: 'uuid1',
        user: 'user1',
        text: '',
        media: [],
        seen: true,
      };

      const sentMessage2 = {
        uuid: 'uuid2',
        user: 'user1',
        text: '',
        media: [],
        seen: true,
      };

      const sentMedia1 = { url: 'url1', type: 'image/jpeg' };
      const sentMedia2 = { url: 'url2', type: 'image/png' };

      mockSendItemMedia
        .mockResolvedValueOnce({
          media_response: sentMedia1,
          message_response: sentMessage1,
        })
        .mockResolvedValueOnce({
          media_response: sentMedia2,
          message_response: sentMessage2,
        });

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
        internal_note: null,
        media: [
          {
            preview: 'url',
            file: expect.any(File),
            content_type: 'image/png',
          },
        ],
        seen: true,
        created_on: expect.any(String),
        replied_message: null,
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
      vi.spyOn(console, 'error').mockImplementation(() => {});

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

  describe('sendMediasWithText', () => {
    let mockUploadItemMedia;
    let mockCreateItemMessage;
    let mockAddMessage;
    let mockAddFailedMessage;
    let mockAddSortedMessage;
    let mockUpdateMessage;

    beforeEach(() => {
      mockUploadItemMedia = vi.fn();
      mockCreateItemMessage = vi.fn();
      mockAddMessage = vi.fn();
      mockAddFailedMessage = vi.fn();
      mockAddSortedMessage = vi.fn();
      mockUpdateMessage = vi.fn();
      vi.clearAllMocks();
      window.URL.createObjectURL = () => 'url';
    });

    it('should wait for all uploads before creating the message', async () => {
      const media1 = new File(['content1'], 'file1.jpg', {
        type: 'image/jpeg',
      });
      const media2 = new File(['content2'], 'file2.png', { type: 'image/png' });

      mockUploadItemMedia
        .mockResolvedValueOnce({ uuid: 'uploaded-1' })
        .mockResolvedValueOnce({ uuid: 'uploaded-2' });
      mockCreateItemMessage.mockResolvedValue({
        uuid: 'server-msg',
        text: 'caption',
        media: [{ uuid: 'uploaded-1' }, { uuid: 'uploaded-2' }],
      });

      await sendMediasWithText({
        itemType: 'room',
        itemUuid: 'uuid1',
        itemUser: { id: 1 },
        medias: [media1, media2],
        text: 'caption',
        uploadItemMedia: mockUploadItemMedia,
        createItemMessage: mockCreateItemMessage,
        addMessage: mockAddMessage,
        addFailedMessage: mockAddFailedMessage,
        addSortedMessage: mockAddSortedMessage,
        updateMessage: mockUpdateMessage,
      });

      expect(mockUploadItemMedia).toHaveBeenCalledTimes(2);
      expect(mockCreateItemMessage).toHaveBeenCalledWith({
        text: 'caption',
        media: ['uploaded-1', 'uploaded-2'],
      });
      expect(mockAddFailedMessage).not.toHaveBeenCalled();
      expect(mockUpdateMessage).toHaveBeenCalledTimes(1);
    });

    it('should not create the message when any upload fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const media1 = new File(['content1'], 'file1.jpg', {
        type: 'image/jpeg',
      });
      const media2 = new File(['content2'], 'file2.png', { type: 'image/png' });

      mockUploadItemMedia
        .mockResolvedValueOnce({ uuid: 'uploaded-1' })
        .mockRejectedValueOnce(new Error('upload failed'));

      await sendMediasWithText({
        itemType: 'room',
        itemUuid: 'uuid1',
        itemUser: { id: 1 },
        medias: [media1, media2],
        text: 'caption',
        uploadItemMedia: mockUploadItemMedia,
        createItemMessage: mockCreateItemMessage,
        addMessage: mockAddMessage,
        addFailedMessage: mockAddFailedMessage,
        addSortedMessage: mockAddSortedMessage,
        updateMessage: mockUpdateMessage,
      });

      expect(mockCreateItemMessage).not.toHaveBeenCalled();
      expect(mockAddFailedMessage).toHaveBeenCalledTimes(1);
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
});
