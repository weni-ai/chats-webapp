import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRoomMessages } from '../roomMessages';
import { useRooms } from '../rooms';
import Message from '@/services/api/resources/chats/message';

vi.mock('../rooms');
vi.mock('@/services/api/resources/chats/message', () => ({
  default: {
    getByRoom: vi.fn(),
    sendRoomMessage: vi.fn(),
    sendRoomMedia: vi.fn(),
  },
}));

describe('useRoomMessages Store', () => {
  let roomMessagesStore;
  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());

    useRooms.mockReturnValue({
      activeRoom: { uuid: 'room-123', user: { email: 'test@test.com' } },
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
    roomMessagesStore.isMessageInActiveRoom = vi.fn().mockReturnValue(true);
    roomMessagesStore.isMessageInActiveRoom = vi.fn().mockReturnValue(true);
    const message = { uuid: '123', room: 'room-1' };
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
    await roomMessagesStore.sendRoomMessage('Hello');
    expect(Message.sendRoomMessage).toHaveBeenCalledWith(
      roomStore.activeRoom.uuid,
      {
        seen: true,
        text: 'Hello',
        user_email: roomStore.activeRoom.user.email,
      },
    );
  });

  it('should resend a room message', async () => {
    const roomStore = useRooms();
    Message.sendRoomMessage.mockResolvedValue({ uuid: '123', text: 'Hello' });

    await roomMessagesStore.resendRoomMessage({
      message: { uuid: '123', text: 'Resend' },
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

    expect(Message.getByRoom).toHaveBeenCalledWith(
      { nextReq: '' },
      'room-123',
      null,
      null,
    );

    expect(roomMessagesStore.roomMessages).toEqual(mockMessages);
    expect(roomMessagesStore.roomMessagesNext).toBe('next-url');
    expect(roomMessagesStore.roomMessagesPrevious).toBe('prev-url');
  });

  it('should resend all failed messages in order', async () => {
    roomMessagesStore.roomMessagesSendingUuids = ['msg-1', 'msg-2', 'msg-3'];
    roomMessagesStore.roomMessages = [
      { uuid: 'msg-1', text: 'Hello' },
      { uuid: 'msg-2', text: 'World' },
      { uuid: 'msg-3', text: 'Test' },
    ];

    roomMessagesStore.resendRoomMessage = vi.fn();

    await roomMessagesStore.resendRoomMessages();

    expect(roomMessagesStore.resendRoomMessage).toHaveBeenCalledTimes(3);
    expect(roomMessagesStore.resendRoomMessage).toHaveBeenNthCalledWith(1, {
      message: { uuid: 'msg-1', text: 'Hello' },
    });
    expect(roomMessagesStore.resendRoomMessage).toHaveBeenNthCalledWith(2, {
      message: { uuid: 'msg-2', text: 'World' },
    });
    expect(roomMessagesStore.resendRoomMessage).toHaveBeenNthCalledWith(3, {
      message: { uuid: 'msg-3', text: 'Test' },
    });
  });
});
