import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useRooms } from '@/store/modules/chats/rooms';

export default async (room) => {
  const roomsStore = useRooms();
  const roomMessageStore = useRoomMessages();
  roomsStore.removeRoom(room.uuid);
  delete roomMessageStore.lastRoomMessageNotification[room.uuid];
};
