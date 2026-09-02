import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRoomMessages } from '../roomMessages';
import { useRooms } from '../rooms';
import Message from '@/services/api/resources/chats/message';
import Media from '@/services/api/resources/chats/media';
import RoomNotes from '@/services/api/resources/chats/roomNotes';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { sendRoomMessageBySocket } from '@/services/api/websocket/messages';
import { MEDIA_MESSAGES_WITH_TEXT_FEATURE_FLAG } from '@/composables/useMediaMessagesWithTextFeatureFlag';

vi.mock('../rooms');
vi.mock('@/store/modules/profile', () => ({
  useProfile: vi.fn(() => ({ me: { email: 'test@test.com' } })),
}));
vi.mock('../messageManager', () => ({
  useMessageManager: vi.fn(() => ({
    clearInputs: vi.fn(),
  })),
}));
vi.mock('@/services/api/resources/chats/message', () => ({
  default: {
    getByRoom: vi.fn(),
    sendRoomMessage: vi.fn(),
    sendRoomMedia: vi.fn(),
  },
}));
vi.mock('@/services/api/resources/chats/media', () => ({
  default: {
    uploadRoomMedia: vi.fn(),
  },
}));
vi.mock('@/services/api/resources/chats/roomNotes', () => ({
  default: {
    createInternalNote: vi.fn(),
  },
}));
vi.mock('@/store/modules/featureFlag', () => ({
  useFeatureFlag: vi.fn(() => ({
    featureFlags: { active_features: [] },
  })),
}));
vi.mock('@/services/api/websocket/messages', () => ({
  sendRoomMessageBySocket: vi.fn(),
}));

describe('useRoomMessages Store', () => {
  let roomMessagesStore;
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(),
    });
    setActivePinia(createPinia());

    useRooms.mockReturnValue({
      activeRoom: { uuid: 'room-123', user: { email: 'test@test.com' } },
    });
    useFeatureFlag.mockReturnValue({
      featureFlags: { active_features: [] },
    });

    roomMessagesStore = useRoomMessages();
  });

  it('should initialize state correctly', () => {
    expect(roomMessagesStore.roomMessages).toEqual([]);
    expect(roomMessagesStore.roomMessagesSorted).toEqual([]);
    expect(roomMessagesStore.roomMessagesSendingUuids).toEqual([]);
    expect(roomMessagesStore.roomMessagesInPromiseUuids).toEqual([]);
    expect(roomMessagesStore.roomMessagesFailedUuids).toEqual([]);
    expect(roomMessagesStore.roomMessagesNext).toBe('');
    expect(roomMessagesStore.roomMessagesPrevious).toBe('');
  });

  it('should add a failed message', () => {
    const message = {
      uuid: '123',
      room: 'room-123',
      user: { email: 'test@test.com' },
    };
    roomMessagesStore.addFailedMessage({ message });
    expect(roomMessagesStore.roomMessagesFailedUuids).toContain('123');
  });

  it('should reset room messages', () => {
    roomMessagesStore.roomMessages = [{ uuid: '123' }];
    roomMessagesStore.roomMessagesNext = 'next';
    roomMessagesStore.roomMessagesPrevious = 'prev';

    roomMessagesStore.resetRoomMessages();
    expect(roomMessagesStore.roomMessages).toEqual([]);
    expect(roomMessagesStore.roomMessagesNext).toBe('');
    expect(roomMessagesStore.roomMessagesPrevious).toBe('');
  });

  it('should add a message', async () => {
    const message = {
      uuid: '123',
      text: 'Hello',
      user: {
        uuid: '1',
        email: 'test@test.com',
        name: 'name',
        first_name: 'first',
        last_name: 'last',
      },
    };
    roomMessagesStore.isMessageInActiveRoom = vi.fn().mockReturnValue(true);
    await roomMessagesStore.addMessage(message);

    expect(roomMessagesStore.roomMessages).toContainEqual({
      ...message,
      sender: message.user,
    });
  });

  it('should send a room message', async () => {
    const roomStore = useRooms();
    Message.sendRoomMessage.mockResolvedValue({ uuid: '123', text: 'Hello' });
    await roomMessagesStore.sendRoomMessage(
      'Hello',
      undefined,
      null,
      'room-123',
    );
    expect(Message.sendRoomMessage).toHaveBeenCalledWith(
      roomStore.activeRoom.uuid,
      {
        seen: true,
        text: 'Hello',
        user_email: roomStore.activeRoom.user.email,
        aiTextImprovement: null,
        repliedMessageId: undefined,
      },
    );
  });

  it('should not send a room message when roomUuid is missing', async () => {
    await roomMessagesStore.sendRoomMessage('Hello');
    expect(Message.sendRoomMessage).not.toHaveBeenCalled();
  });

  it('should resend a room message', async () => {
    const roomStore = useRooms();
    Message.sendRoomMessage.mockResolvedValue({ uuid: '123', text: 'Hello' });

    await roomMessagesStore.resendRoomMessage({
      message: { uuid: '123', text: 'Resend' },
      roomUuid: 'room-123',
    });
    expect(Message.sendRoomMessage).toHaveBeenCalledWith(
      roomStore.activeRoom.uuid,
      {
        seen: true,
        text: 'Resend',
        user_email: roomStore.activeRoom.user.email,
      },
    );
  });

  it('should not resend a room message when roomUuid is missing', async () => {
    await roomMessagesStore.resendRoomMessage({
      message: { uuid: '123', text: 'Resend' },
    });
    expect(Message.sendRoomMessage).not.toHaveBeenCalled();
  });

  it('should send a room message via socket when the feature flag is enabled', async () => {
    useFeatureFlag.mockReturnValue({
      featureFlags: { active_features: ['weniChatsSocketMessageSend'] },
    });
    crypto.randomUUID.mockReturnValue('req-socket-1');
    sendRoomMessageBySocket.mockResolvedValue({
      uuid: 'server-1',
      text: 'Hello',
      room: 'room-123',
    });

    await roomMessagesStore.sendRoomMessage(
      'Hello',
      undefined,
      { status: 'USED', type: 'GRAMMAR_AND_SPELLING' },
      'room-123',
    );

    expect(sendRoomMessageBySocket).toHaveBeenCalledWith({
      room: 'room-123',
      text: 'Hello',
      aiTextImprovement: { status: 'USED', type: 'GRAMMAR_AND_SPELLING' },
      requestId: 'req-socket-1',
    });
    expect(Message.sendRoomMessage).not.toHaveBeenCalled();
  });

  it('should mark the message as failed when socket send rejects', async () => {
    useFeatureFlag.mockReturnValue({
      featureFlags: { active_features: ['weniChatsSocketMessageSend'] },
    });
    crypto.randomUUID.mockReturnValue('req-fail-1');
    sendRoomMessageBySocket.mockRejectedValue(new Error('timeout'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await roomMessagesStore.sendRoomMessage(
      'Hello',
      undefined,
      null,
      'room-123',
    );

    expect(roomMessagesStore.roomMessagesFailedUuids).toContain('req-fail-1');
    expect(roomMessagesStore.roomMessagesSendingUuids).not.toContain(
      'req-fail-1',
    );

    errorSpy.mockRestore();
  });

  it('should resend a room message via socket when the feature flag is enabled', async () => {
    useFeatureFlag.mockReturnValue({
      featureFlags: { active_features: ['weniChatsSocketMessageSend'] },
    });
    crypto.randomUUID.mockReturnValue('req-resend-1');
    sendRoomMessageBySocket.mockResolvedValue({
      uuid: 'server-2',
      text: 'Resend',
      room: 'room-123',
    });

    const message = {
      uuid: 'old-temp',
      text: 'Resend',
      room: 'room-123',
      user: { email: 'test@test.com' },
    };
    roomMessagesStore.roomMessagesFailedUuids = ['old-temp'];

    await roomMessagesStore.resendRoomMessage({
      message,
      roomUuid: 'room-123',
    });

    expect(roomMessagesStore.roomMessagesFailedUuids).not.toContain('old-temp');
    expect(sendRoomMessageBySocket).toHaveBeenCalledWith({
      room: 'room-123',
      text: 'Resend',
      requestId: 'req-resend-1',
    });
    expect(Message.sendRoomMessage).not.toHaveBeenCalled();
  });

  it('should send room medias with roomUuid', async () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    Message.sendRoomMedia.mockResolvedValue({
      media_response: { content_type: 'image/png' },
      message_response: { uuid: 'm-1', media: [] },
    });
    const file = new File(['x'], 'image.png', { type: 'image/png' });

    await roomMessagesStore.sendRoomMedias({
      files: [file],
      updateLoadingFiles: vi.fn(),
      repliedMessage: null,
      roomUuid: 'room-123',
    });

    expect(Message.sendRoomMedia).toHaveBeenCalledWith(
      'room-123',
      expect.objectContaining({
        user_email: 'test@test.com',
        media: file,
        repliedMessageId: undefined,
      }),
    );
    expect(
      Message.sendRoomMedia.mock.calls[0][1].createMessage,
    ).toBeUndefined();
  });

  it('should upload all medias via v2 and create one message when the media with text flag is enabled', async () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    useFeatureFlag.mockReturnValue({
      featureFlags: {
        active_features: [MEDIA_MESSAGES_WITH_TEXT_FEATURE_FLAG],
      },
    });
    Media.uploadRoomMedia
      .mockResolvedValueOnce({ uuid: 'uploaded-1' })
      .mockResolvedValueOnce({ uuid: 'uploaded-2' });
    Message.sendRoomMessage.mockResolvedValue({
      uuid: 'msg-1',
      text: 'caption',
      media: [{ uuid: 'uploaded-1' }, { uuid: 'uploaded-2' }],
    });
    const file1 = new File(['x'], 'image.png', { type: 'image/png' });
    const file2 = new File(['y'], 'photo.jpg', { type: 'image/jpeg' });

    await roomMessagesStore.sendRoomMedias({
      files: [file1, file2],
      text: 'caption',
      updateLoadingFiles: vi.fn(),
      repliedMessage: null,
      roomUuid: 'room-123',
    });

    expect(Media.uploadRoomMedia).toHaveBeenCalledTimes(2);
    expect(Message.sendRoomMessage).toHaveBeenCalledWith(
      'room-123',
      expect.objectContaining({
        text: 'caption',
        media: ['uploaded-1', 'uploaded-2'],
      }),
    );
    expect(Message.sendRoomMedia).not.toHaveBeenCalled();
  });

  it('should not create a message when a v2 upload fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    useFeatureFlag.mockReturnValue({
      featureFlags: {
        active_features: [MEDIA_MESSAGES_WITH_TEXT_FEATURE_FLAG],
      },
    });
    Media.uploadRoomMedia.mockRejectedValue(new Error('upload failed'));
    const file = new File(['x'], 'image.png', { type: 'image/png' });

    await roomMessagesStore.sendRoomMedias({
      files: [file],
      text: 'caption',
      updateLoadingFiles: vi.fn(),
      repliedMessage: null,
      roomUuid: 'room-123',
    });

    expect(Message.sendRoomMessage).not.toHaveBeenCalled();
    expect(Message.sendRoomMedia).not.toHaveBeenCalled();
  });

  it('should create media message via socket when the feature flag is enabled', async () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    useFeatureFlag.mockReturnValue({
      featureFlags: { active_features: ['weniChatsSocketMessageSend'] },
    });
    crypto.randomUUID.mockReturnValue('req-media-1');
    sendRoomMessageBySocket.mockResolvedValue({
      uuid: 'server-media-1',
      text: '',
      room: 'room-123',
    });
    Message.sendRoomMedia.mockImplementation(async (_roomId, options) => {
      const messageResponse = await options.createMessage();
      return {
        media_response: { content_type: 'image/png' },
        message_response: { ...messageResponse, media: [] },
      };
    });
    const file = new File(['x'], 'image.png', { type: 'image/png' });

    await roomMessagesStore.sendRoomMedias({
      files: [file],
      updateLoadingFiles: vi.fn(),
      repliedMessage: null,
      roomUuid: 'room-123',
    });

    expect(Message.sendRoomMedia).toHaveBeenCalledWith(
      'room-123',
      expect.objectContaining({
        user_email: 'test@test.com',
        media: file,
        createMessage: expect.any(Function),
      }),
    );
    expect(sendRoomMessageBySocket).toHaveBeenCalledWith({
      room: 'room-123',
      text: '',
      requestId: 'req-media-1',
    });
  });

  it('should not send room medias when roomUuid is missing', async () => {
    const file = new File(['x'], 'image.png', { type: 'image/png' });

    await roomMessagesStore.sendRoomMedias({
      files: [file],
      updateLoadingFiles: vi.fn(),
      repliedMessage: null,
    });

    expect(Message.sendRoomMedia).not.toHaveBeenCalled();
  });

  it('should resend room media via socket when the feature flag is enabled', async () => {
    useFeatureFlag.mockReturnValue({
      featureFlags: { active_features: ['weniChatsSocketMessageSend'] },
    });
    crypto.randomUUID.mockReturnValue('req-resend-media-1');
    sendRoomMessageBySocket.mockResolvedValue({
      uuid: 'server-media-2',
      text: '',
      room: 'room-123',
    });
    Message.sendRoomMedia.mockImplementation(async (_roomId, options) => {
      await options.createMessage();
      return { content_type: 'image/png' };
    });

    const file = new File(['x'], 'image.png', { type: 'image/png' });
    const message = {
      uuid: 'old-media',
      text: '',
      room: 'room-123',
      user: { email: 'test@test.com' },
      media: [{ preview: 'blob:preview', file, content_type: 'image/png' }],
    };

    await roomMessagesStore.resendRoomMedia({
      message,
      media: message.media[0],
      roomUuid: 'room-123',
    });

    expect(Message.sendRoomMedia).toHaveBeenCalledWith(
      'room-123',
      expect.objectContaining({
        media: file,
        createMessage: expect.any(Function),
      }),
    );
    expect(sendRoomMessageBySocket).toHaveBeenCalledWith({
      room: 'room-123',
      text: '',
      requestId: 'req-resend-media-1',
    });
  });

  it('should send a room internal note with roomUuid', async () => {
    RoomNotes.createInternalNote.mockResolvedValue({ uuid: 'note-1' });

    await roomMessagesStore.sendRoomInternalNote({
      text: 'My note',
      roomUuid: 'room-123',
    });

    expect(RoomNotes.createInternalNote).toHaveBeenCalledWith({
      text: 'My note',
      room: 'room-123',
    });
  });

  it('should not send a room internal note when roomUuid is missing', async () => {
    await roomMessagesStore.sendRoomInternalNote({ text: 'My note' });

    expect(RoomNotes.createInternalNote).not.toHaveBeenCalled();
  });

  it('should remove message from sendings', () => {
    roomMessagesStore.roomMessagesSendingUuids = ['uuid1', 'uuid2', 'uuid3'];

    roomMessagesStore.removeMessageFromSendings('uuid2');

    expect(roomMessagesStore.roomMessagesSendingUuids).toEqual([
      'uuid1',
      'uuid3',
    ]);
  });

  it('should remove message from in promise', () => {
    roomMessagesStore.roomMessagesInPromiseUuids = ['uuid1', 'uuid2', 'uuid3'];

    roomMessagesStore.removeMessageFromInPromise('uuid2');

    expect(roomMessagesStore.roomMessagesInPromiseUuids).toEqual([
      'uuid1',
      'uuid3',
    ]);
  });

  it('should remove message from in faileds', () => {
    roomMessagesStore.roomMessagesFailedUuids = ['uuid1', 'uuid2', 'uuid3'];

    roomMessagesStore.removeMessageFromFaileds('uuid2');

    expect(roomMessagesStore.roomMessagesFailedUuids).toEqual([
      'uuid1',
      'uuid3',
    ]);
  });

  it('should return true if message belongs to active room', () => {
    useRooms.mockReturnValue({
      activeRoom: { uuid: 'room-123' },
    });

    const message = { room: 'room-123' };
    expect(roomMessagesStore.isMessageInActiveRoom(message)).toBe(true);
  });

  it('should return false if message does not belong to active room', () => {
    useRooms.mockReturnValue({
      activeRoom: { uuid: 'room-123' },
    });

    const message = { room: 'room-999' };
    expect(roomMessagesStore.isMessageInActiveRoom(message)).toBe(false);
  });

  it('should fetch room messages and update the state', async () => {
    const mockMessages = [
      { uuid: 'msg-1', text: 'Hello', room: 'room-123' },
      { uuid: 'msg-2', text: 'World', room: 'room-123' },
    ];

    Message.getByRoom.mockResolvedValue({
      results: mockMessages,
      next: 'next-url',
      previous: 'prev-url',
    });

    await roomMessagesStore.getRoomMessages();

    expect(Message.getByRoom).toHaveBeenCalledWith({ nextReq: '' }, 'room-123');

    expect(roomMessagesStore.roomMessages).toEqual(mockMessages);
    expect(roomMessagesStore.roomMessagesNext).toBe('next-url');
    expect(roomMessagesStore.roomMessagesPrevious).toBe('prev-url');
  });

  it('should resend all failed messages in order forwarding each message room', async () => {
    roomMessagesStore.roomMessagesSendingUuids = ['msg-1', 'msg-2', 'msg-3'];
    roomMessagesStore.roomMessages = [
      { uuid: 'msg-1', text: 'Hello', room: 'room-123' },
      { uuid: 'msg-2', text: 'World', room: 'room-123' },
      { uuid: 'msg-3', text: 'Test', room: 'room-456' },
    ];

    roomMessagesStore.resendRoomMessage = vi.fn();

    await roomMessagesStore.resendRoomMessages();

    expect(roomMessagesStore.resendRoomMessage).toHaveBeenCalledTimes(3);
    expect(roomMessagesStore.resendRoomMessage).toHaveBeenNthCalledWith(1, {
      message: { uuid: 'msg-1', text: 'Hello', room: 'room-123' },
      roomUuid: 'room-123',
    });
    expect(roomMessagesStore.resendRoomMessage).toHaveBeenNthCalledWith(2, {
      message: { uuid: 'msg-2', text: 'World', room: 'room-123' },
      roomUuid: 'room-123',
    });
    expect(roomMessagesStore.resendRoomMessage).toHaveBeenNthCalledWith(3, {
      message: { uuid: 'msg-3', text: 'Test', room: 'room-456' },
      roomUuid: 'room-456',
    });
  });
});
