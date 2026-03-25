import { useRooms } from '@/store/modules/chats/rooms';

export default async (room) => {
  const roomsStore = useRooms();
  roomsStore.removeRoom(room.uuid);
};
