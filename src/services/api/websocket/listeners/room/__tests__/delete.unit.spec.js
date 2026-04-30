import { describe, it, expect, vi, beforeEach } from 'vitest';
import wsDeleteRoom from '@/services/api/websocket/listeners/room/delete';
import { useRooms } from '@/store/modules/chats/rooms';

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

vi.mock('@/store/modules/chats/roomCounters', () => ({
  useRoomCounters: vi.fn(() => ({
    handleClose: vi.fn(),
  })),
}));

describe('Room delete', () => {
  let roomsStoreMock;

  beforeEach(() => {
    roomsStoreMock = {
      rooms: [],
      removeRoom: vi.fn(),
    };

    useRooms.mockReturnValue(roomsStoreMock);
  });

  it('should call removeRoom with the correct uuid', () => {
    const room = { uuid: 'room1' };

    wsDeleteRoom(room);

    expect(roomsStoreMock.removeRoom).toHaveBeenCalledWith('room1');
  });
});
