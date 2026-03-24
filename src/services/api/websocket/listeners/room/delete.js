import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import { getRoomType } from '@/utils/room';

export default async (room) => {
  const roomsStore = useRooms();
  const counters = useRoomCounters();

  const existingRoom = roomsStore.rooms.find((r) => r.uuid === room.uuid);
  const roomType = existingRoom ? getRoomType(existingRoom) : getRoomType(room);

  roomsStore.removeRoom(room.uuid);
  counters.handleClose(roomType);
};
