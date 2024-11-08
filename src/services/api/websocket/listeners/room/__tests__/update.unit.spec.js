import { describe, it, expect, vi, beforeEach } from 'vitest';
import wsRoomUpdate from '@/services/api/websocket/listeners/room/update';
import { useRooms } from '@/store/modules/chats/rooms';
import SoundNotification from '@/services/api/websocket/soundNotification';

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

vi.mock('@/services/api/websocket/soundNotification', () => ({
  default: vi.fn().mockImplementation(() => ({
    notify: vi.fn(),
  })),
}));

describe('Room update', () => {
  let appMock;
  let roomsStoreMock;
  let soundNotificationMock;

  beforeEach(() => {
    appMock = {
      me: {
        email: 'user@example.com',
      },
      $router: {
        replace: vi.fn(),
      },
      viewedAgent: {
        email: 'agent@example.com',
      },
    };

    roomsStoreMock = {
      rooms: [],
      addRoom: vi.fn(),
      updateRoom: vi.fn(),
      resetNewMessagesByRoom: vi.fn(),
    };

    useRooms.mockReturnValue(roomsStoreMock);

    soundNotificationMock = new SoundNotification('achievement-confirmation');
    SoundNotification.mockReturnValue(soundNotificationMock);
  });

  it('should not add the room if it already exists in roomsStore', () => {
    const room = {
      uuid: 'room1',
      transfer_history: { action: 'transfer' },
      unread_msgs: 1,
    };
    roomsStoreMock.rooms = [{ uuid: 'room1' }];

    wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.addRoom).not.toHaveBeenCalled();
    expect(soundNotificationMock.notify).not.toHaveBeenCalled();
  });

  it('should add the room and play achievement sound if transfer action is "transfer"', () => {
    const room = {
      uuid: 'room1',
      transfer_history: { action: 'transfer' },
      unread_msgs: 1,
    };

    wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.addRoom).toHaveBeenCalledWith(room);
    expect(soundNotificationMock.notify).toHaveBeenCalledWith();
  });

  it('should add the room and play select sound if transfer action is "forward"', () => {
    const room = {
      uuid: 'room1',
      transfer_history: { action: 'forward' },
      unread_msgs: 1,
    };
    soundNotificationMock.notify.mockClear();

    wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.addRoom).toHaveBeenCalledWith(room);
    expect(soundNotificationMock.notify).toHaveBeenCalledWith();
  });

  it('should update the room in the store', () => {
    const room = {
      uuid: 'room1',
      transfer_history: { action: 'forward' },
      unread_msgs: 1,
    };

    wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.updateRoom).toHaveBeenCalledWith({
      room,
      userEmail: appMock.me.email,
      routerReplace: expect.any(Function),
      viewedAgentEmail: appMock.viewedAgent.email,
    });
  });

  it('should reset new messages if unread_msgs is 0', () => {
    const room = {
      uuid: 'room1',
      unread_msgs: 0,
      transfer_history: { action: 'forward' },
    };

    wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.resetNewMessagesByRoom).toHaveBeenCalledWith({
      room: room.uuid,
    });
  });

  it('should not reset new messages if unread_msgs is greater than 0', () => {
    const room = {
      uuid: 'room1',
      unread_msgs: 1,
      transfer_history: { action: 'forward' },
    };

    wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.resetNewMessagesByRoom).not.toHaveBeenCalled();
  });
});
