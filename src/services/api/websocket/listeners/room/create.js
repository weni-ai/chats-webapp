import SoundNotification from '@/services/api/websocket/soundNotification';
import { useRooms } from '@/store/modules/chats/rooms';

export default async (room, { app }) => {
  const roomsStore = useRooms();
  if (!!room.user && room.user.email !== app.me.email) return;

  const isExistingRoom = roomsStore.rooms.find(
    (mappedRoom) => mappedRoom.uuid === room.uuid,
  );

  if (!isExistingRoom) {
    roomsStore.addRoom(room);
    const notification = new SoundNotification('select-sound');
    notification.notify();
  }
};
