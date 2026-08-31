import { describe, it, expect, vi, beforeEach } from 'vitest';
import wsRoomMessageCreate from '@/services/api/websocket/listeners/room/message/create';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import SoundNotification from '@/services/api/websocket/soundNotification';
import { useRooms } from '@/store/modules/chats/rooms';
import { isValidJson } from '@/utils/messages';
import { sendWindowNotification } from '@/utils/notifications';
import { useConfig } from '@/store/modules/config';

vi.mock('@/services/api/websocket/soundNotification', () => ({
  default: vi.fn().mockImplementation(() => ({
    notify: vi.fn(),
  })),
}));
vi.mock('@/utils/notifications', () => ({
  sendWindowNotification: vi.fn(),
}));
vi.mock('@/utils/messages', () => ({
  isValidJson: vi.fn(),
}));
vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));
vi.mock('@/store/modules/chats/roomMessages', () => ({
  useRoomMessages: vi.fn(),
}));
vi.mock('@/store/modules/config', () => ({
  useConfig: vi.fn(),
}));

describe('Room message create', () => {
  let message;
  let appMock;
  let roomsStoreMock;
  let roomMessagesStoreMock;
  let configStoreMock;
  let soundNotificationMock;

  beforeEach(() => {
    message = {
      room: 'room-123',
      user: { email: 'otheruser@example.com' },
      contact: { name: 'John Doe' },
      text: 'Hello!',
      media: [{ url: 'image-url' }],
      created_on: '2024-01-01T00:00:00Z',
      uuid: 'msg-123',
    };

    appMock = {
      me: { email: 'user@example.com' },
      $route: {
        name: 'room',
        params: { roomId: 'room-123', viewedAgent: false },
      },
    };

    roomMessagesStoreMock = {
      addMessage: vi.fn(),
    };
    roomsStoreMock = {
      rooms: [
        { uuid: 'room-123', contact: { name: 'John Doe' }, user: {} },
        { uuid: 'room-456', contact: { name: 'Jane Doe' } },
      ],
      activeRoom: { uuid: 'room-123' },
      bringRoomFront: vi.fn(),
      addNewMessagesByRoom: vi.fn(),
    };

    configStoreMock = {};
    soundNotificationMock = new SoundNotification('ping-bing');
    SoundNotification.mockReturnValue(soundNotificationMock);
    useConfig.mockReturnValue(configStoreMock);
    useRooms.mockReturnValue(roomsStoreMock);
    useRoomMessages.mockReturnValue(roomMessagesStoreMock);

    vi.clearAllMocks();
    isValidJson.mockReturnValue(false);
  });

  it('should not bring the room to the front when a valid waiting room is found', async () => {
    await wsRoomMessageCreate(
      { ...message, room: 'room-456' },
      { app: appMock },
    );

    expect(roomsStoreMock.bringRoomFront).not.toHaveBeenCalled();
  });

  it('should not notify or add a message if the sender is the current user', async () => {
    message.user.email = 'user@example.com';

    await wsRoomMessageCreate(message, { app: appMock });

    expect(soundNotificationMock.notify).not.toHaveBeenCalled();
    expect(roomMessagesStoreMock.addMessage).not.toHaveBeenCalled();
  });

  it('should play a sound notification and add a message if the sender is different from the current user', async () => {
    await wsRoomMessageCreate(message, { app: appMock });

    expect(soundNotificationMock.notify).toHaveBeenCalled();
    expect(roomMessagesStoreMock.addMessage).toHaveBeenCalledWith(message);
  });

  it('should send a window notification if the document is hidden', async () => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });

    await wsRoomMessageCreate(message, { app: appMock });

    expect(sendWindowNotification).toHaveBeenCalledWith({
      title: 'John Doe',
      message: 'Hello!',
      image: 'image-url',
    });
  });

  it('should add a new message to the room if not in the current room view', async () => {
    await wsRoomMessageCreate(message, { app: appMock });

    expect(roomsStoreMock.addNewMessagesByRoom).toHaveBeenCalledWith({
      room: 'room-123',
      message: {
        created_on: '2024-01-01T00:00:00Z',
        uuid: 'msg-123',
        text: 'Hello!',
      },
    });
  });

  it('should add a message if the current view mode matches the active room', async () => {
    appMock.$route.params.viewedAgent = true;
    appMock.$route.params.roomId = 'room-456';

    await wsRoomMessageCreate(message, { app: appMock });

    expect(roomMessagesStoreMock.addMessage).toHaveBeenCalledWith(message);
  });

  it('should not add new messages if the text is valid JSON', async () => {
    isValidJson.mockReturnValue(true);

    await wsRoomMessageCreate(message, { app: appMock });

    expect(roomsStoreMock.addNewMessagesByRoom).not.toHaveBeenCalled();
  });

  it('should update last_message on a waiting room when a bulk message arrives', async () => {
    const waitingRoom = roomsStoreMock.rooms[1];
    waitingRoom.last_message = { text: 'previous' };
    waitingRoom.last_interaction = '2024-01-01T00:00:00Z';

    const bulkMessage = {
      uuid: 'bulk-msg-1',
      user: null,
      room: 'room-456',
      contact: null,
      text: 'teste disparo',
      media: [],
      created_on: '2026-08-18T17:24:01.351446-03:00',
      bulk_message: {
        sent_by: { email: 'otheruser@example.com', name: 'Other User' },
      },
    };

    await wsRoomMessageCreate(bulkMessage, { app: appMock });

    expect(waitingRoom.last_message).toEqual(bulkMessage);
    expect(waitingRoom.last_interaction).toBe(bulkMessage.created_on);
  });

  it('should not notify or increment unread when the bulk message was sent by the current user', async () => {
    const waitingRoom = roomsStoreMock.rooms[1];
    waitingRoom.last_message = { text: 'previous' };

    const bulkMessage = {
      uuid: 'bulk-msg-2',
      user: null,
      room: 'room-456',
      contact: null,
      text: 'teste disparo',
      media: [],
      created_on: '2026-08-18T17:24:01.351446-03:00',
      bulk_message: {
        sent_by: { email: 'user@example.com', name: 'Current User' },
      },
    };

    await wsRoomMessageCreate(bulkMessage, { app: appMock });

    expect(waitingRoom.last_message).toEqual(bulkMessage);
    expect(waitingRoom.last_interaction).toBe(bulkMessage.created_on);
    expect(soundNotificationMock.notify).not.toHaveBeenCalled();
    expect(sendWindowNotification).not.toHaveBeenCalled();
    expect(roomsStoreMock.addNewMessagesByRoom).not.toHaveBeenCalled();
  });

  it('should add a bulk message to the transcript when the waiting room is open', async () => {
    appMock.$route.params.roomId = 'room-456';

    const bulkMessage = {
      uuid: 'bulk-msg-3',
      user: null,
      room: 'room-456',
      contact: null,
      text: 'teste disparo',
      media: [],
      created_on: '2026-08-18T17:24:01.351446-03:00',
      bulk_message: {
        sent_by: { email: 'user@example.com', name: 'Current User' },
      },
    };

    await wsRoomMessageCreate(bulkMessage, { app: appMock });

    expect(roomMessagesStoreMock.addMessage).toHaveBeenCalledWith(bulkMessage);
    expect(soundNotificationMock.notify).not.toHaveBeenCalled();
  });

  it('should not update last_message for a system message without bulk_message', async () => {
    const waitingRoom = roomsStoreMock.rooms[1];
    const previousLastMessage = { text: 'previous' };
    waitingRoom.last_message = previousLastMessage;
    waitingRoom.last_interaction = '2024-01-01T00:00:00Z';

    const systemMessage = {
      uuid: 'system-msg-1',
      user: null,
      room: 'room-456',
      contact: null,
      text: 'Room transferred',
      media: [],
      created_on: '2026-08-18T17:24:01.351446-03:00',
    };

    await wsRoomMessageCreate(systemMessage, { app: appMock });

    expect(waitingRoom.last_message).toEqual(previousLastMessage);
    expect(waitingRoom.last_interaction).toBe('2024-01-01T00:00:00Z');
  });
});
