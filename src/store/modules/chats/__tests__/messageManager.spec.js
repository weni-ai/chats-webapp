import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import { useMessageManager } from '../messageManager';
import { useRoomMessages } from '../roomMessages';
import { useDiscussionMessages } from '../discussionMessages';

vi.mock('@/services/api/resources/chats/aiTextImprovement', () => ({
  default: { improve: vi.fn() },
}));
vi.mock('@/utils/callUnnnicAlert', () => ({ default: vi.fn() }));

const ROOM_UUID = 'room-123';

const setup = ({ messageManager = {}, discussions = {} } = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      messageManager: {
        inputMessage: '',
        isInternalNote: false,
        mediaUploadFiles: [],
        audioMessage: null,
        replyMessage: null,
        ...messageManager,
      },
      discussions: {
        activeDiscussion: null,
        ...discussions,
      },
    },
  });
  setActivePinia(pinia);

  const store = useMessageManager();
  const roomMessagesStore = useRoomMessages();
  const discussionMessagesStore = useDiscussionMessages();

  roomMessagesStore.sendRoomMessage = vi.fn(() => Promise.resolve());
  roomMessagesStore.sendRoomMedias = vi.fn(() => Promise.resolve());
  roomMessagesStore.sendRoomInternalNote = vi.fn(() => Promise.resolve());
  discussionMessagesStore.sendDiscussionMessage = vi.fn(() =>
    Promise.resolve(),
  );
  discussionMessagesStore.sendDiscussionMedias = vi.fn(() => Promise.resolve());

  return { store, roomMessagesStore, discussionMessagesStore };
};

describe('useMessageManager Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendRoomMessage', () => {
    it('sends a text room message forwarding the active room uuid', async () => {
      const { store, roomMessagesStore } = setup({
        messageManager: { inputMessage: 'Hello' },
      });

      await store.sendRoomMessage(ROOM_UUID);

      expect(roomMessagesStore.sendRoomMessage).toHaveBeenCalledWith(
        'Hello',
        null,
        null,
        ROOM_UUID,
      );
    });

    it('does not send a text message when the input is empty', async () => {
      const { store, roomMessagesStore } = setup({
        messageManager: { inputMessage: '   ' },
      });

      await store.sendRoomMessage(ROOM_UUID);

      expect(roomMessagesStore.sendRoomMessage).not.toHaveBeenCalled();
    });

    it('sends an internal note forwarding the active room uuid', async () => {
      const { store, roomMessagesStore } = setup({
        messageManager: { inputMessage: 'My note', isInternalNote: true },
      });

      await store.sendRoomMessage(ROOM_UUID);

      expect(roomMessagesStore.sendRoomInternalNote).toHaveBeenCalledWith(
        expect.objectContaining({ roomUuid: ROOM_UUID }),
      );
      expect(
        roomMessagesStore.sendRoomInternalNote.mock.calls[0][0].text,
      ).toContain('My note');
      expect(roomMessagesStore.sendRoomMessage).not.toHaveBeenCalled();
    });

    it('sends a discussion message (without room uuid) when there is an active discussion', async () => {
      const { store, roomMessagesStore, discussionMessagesStore } = setup({
        messageManager: { inputMessage: 'Hi discussion' },
        discussions: { activeDiscussion: { uuid: 'disc-1' } },
      });

      await store.sendRoomMessage(ROOM_UUID);

      expect(
        discussionMessagesStore.sendDiscussionMessage,
      ).toHaveBeenCalledWith('Hi discussion');
      expect(roomMessagesStore.sendRoomMessage).not.toHaveBeenCalled();
    });
  });

  describe('sendMediasMessage', () => {
    it('sends room medias forwarding the active room uuid', () => {
      const file = new File(['x'], 'image.png', { type: 'image/png' });
      const { store, roomMessagesStore } = setup({
        messageManager: { mediaUploadFiles: [file] },
      });

      store.sendMediasMessage(ROOM_UUID);

      expect(roomMessagesStore.sendRoomMedias).toHaveBeenCalledWith(
        expect.objectContaining({ roomUuid: ROOM_UUID }),
      );
    });

    it('sends discussion medias (without room uuid) when there is an active discussion', () => {
      const file = new File(['x'], 'image.png', { type: 'image/png' });
      const { store, roomMessagesStore, discussionMessagesStore } = setup({
        messageManager: { mediaUploadFiles: [file] },
        discussions: { activeDiscussion: { uuid: 'disc-1' } },
      });

      store.sendMediasMessage(ROOM_UUID);

      expect(discussionMessagesStore.sendDiscussionMedias).toHaveBeenCalled();
      expect(roomMessagesStore.sendRoomMedias).not.toHaveBeenCalled();
    });

    it('clears inputs after sending medias', () => {
      const file = new File(['x'], 'image.png', { type: 'image/png' });
      const { store } = setup({
        messageManager: { mediaUploadFiles: [file] },
      });

      store.sendMediasMessage(ROOM_UUID);

      expect(store.mediaUploadFiles).toEqual([]);
    });
  });

  describe('clearInputs', () => {
    it('resets the message manager state', () => {
      const file = new File(['x'], 'image.png', { type: 'image/png' });
      const { store } = setup({
        messageManager: {
          inputMessage: 'text',
          isInternalNote: true,
          mediaUploadFiles: [file],
        },
      });

      store.clearInputs();

      expect(store.inputMessage).toBe('');
      expect(store.isInternalNote).toBe(false);
      expect(store.mediaUploadFiles).toEqual([]);
      expect(store.replyMessage).toBeNull();
    });
  });

  describe('addMediaUploadFiles', () => {
    it('adds files when within the upload limit', () => {
      const { store } = setup();
      const files = [
        new File(['a'], 'a.png', { type: 'image/png' }),
        new File(['b'], 'b.png', { type: 'image/png' }),
      ];

      store.addMediaUploadFiles(files);

      expect(store.mediaUploadFiles).toHaveLength(2);
    });

    it('does not add files when exceeding the upload limit', () => {
      const { store } = setup();
      const files = Array.from(
        { length: 6 },
        (_, index) =>
          new File(['x'], `file-${index}.png`, { type: 'image/png' }),
      );

      store.addMediaUploadFiles(files);

      expect(store.mediaUploadFiles).toEqual([]);
    });
  });
});
