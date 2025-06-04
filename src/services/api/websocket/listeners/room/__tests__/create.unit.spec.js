import { describe, it, expect, vi, beforeEach } from 'vitest';
import wsRoomCreate from '@/services/api/websocket/listeners/room/create';
import { useRooms } from '@/store/modules/chats/rooms';
import SoundNotification from '@/services/api/websocket/soundNotification';

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

vi.mock('@/store/modules/config', () => ({
  useConfig: vi.fn(() => ({})),
}));

vi.mock('@/services/api/websocket/soundNotification', () => ({
  default: vi.fn().mockImplementation(() => ({
    notify: vi.fn(),
  })),
}));

describe('Room create', () => {
  let appMock;
  let roomsStoreMock;
  let soundNotificationMock;

  beforeEach(() => {
    appMock = {
      me: {
        email: 'user@example.com',
      },
    };

    roomsStoreMock = {
      rooms: [],
      addRoom: vi.fn(),
    };

    useRooms.mockReturnValue(roomsStoreMock);

    soundNotificationMock = new SoundNotification('select-sound');
    SoundNotification.mockReturnValue(soundNotificationMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not add the room if the room.user.email is not equal to app.me.email', () => {
    const room = { user: { email: 'other@example.com' }, uuid: 'room1' };

    wsRoomCreate(room, { app: appMock });

    expect(roomsStoreMock.addRoom).not.toHaveBeenCalled();
    expect(soundNotificationMock.notify).not.toHaveBeenCalled();
  });

  it('should add the room and play a sound notification if the room is not already in roomsStore', () => {
    const room = { user: { email: 'user@example.com' }, uuid: 'room1' };
    roomsStoreMock.rooms = [];

    wsRoomCreate(room, { app: appMock });

    expect(roomsStoreMock.addRoom).toHaveBeenCalledWith(room);
    expect(soundNotificationMock.notify).toHaveBeenCalled();
  });

  it('should not play a sound notification if the room already exists in roomsStore', () => {
    const room = { user: { email: 'user@example.com' }, uuid: 'room1' };
    roomsStoreMock.rooms = [{ uuid: 'room1' }];

    wsRoomCreate(room, { app: appMock });

    expect(roomsStoreMock.addRoom).not.toHaveBeenCalled();
    expect(soundNotificationMock.notify).not.toHaveBeenCalled();
  });
});
