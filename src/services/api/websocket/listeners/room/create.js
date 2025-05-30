import SoundNotification from '@/services/api/websocket/soundNotification';
import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';

export default async (room, { app }) => {
  const roomsStore = useRooms();
  if (!!room.user && room.user.email !== app.me.email) return;

  const isExistingRoom = roomsStore.rooms.find(
    (mappedRoom) => mappedRoom.uuid === room.uuid,
  );

  if (!isExistingRoom) {
    const isWaitingQueueRoom = !room?.user && !room.is_waiting;
    const { enableAutomaticRoomRouting } = useConfig();
    if (isWaitingQueueRoom && enableAutomaticRoomRouting) return;
    roomsStore.addRoom(room);
    const notification = new SoundNotification('select-sound');
    notification.notify();
  }
};
