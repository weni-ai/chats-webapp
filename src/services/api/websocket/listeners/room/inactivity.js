import { useRooms } from '@/store/modules/chats/rooms';

export default (data, _ctx) => {
  const roomsStore = useRooms();

  const existingRoom = roomsStore.rooms.find((r) => r.uuid === data.room_uuid);

  if (!existingRoom) return;

  existingRoom.is_inactive = data.is_inactive;
};
