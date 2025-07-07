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
  });

  it('should bring the room to the front when a valid ongoing room is found', async () => {
    await wsRoomMessageCreate(message, { app: appMock });

    expect(roomsStoreMock.bringRoomFront).toHaveBeenCalledWith(
      roomsStoreMock.rooms[0],
    );
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
});
