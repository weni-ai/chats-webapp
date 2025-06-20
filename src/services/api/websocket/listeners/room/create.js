import SoundNotification from '@/services/api/websocket/soundNotification';
import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { getRoomType } from '@/utils/room';

export default async (room, { app }) => {
  const roomsStore = useRooms();
  if (!!room.user && room.user.email !== app.me.email) return;

  const isExistingRoom = roomsStore.rooms.find(
    (mappedRoom) => mappedRoom.uuid === room.uuid,
  );

  if (!isExistingRoom) {
    const { enableAutomaticRoomRouting } = useConfig();
    const roomType = getRoomType(room);

    if (roomType === 'waiting' && enableAutomaticRoomRouting) return;

    const addAfter = !roomsStore.orderBy[roomType].includes('-');

    roomsStore.addRoom(room, { after: addAfter });

    if (roomType === 'ongoing' && roomsStore.activeTab !== 'ongoing') {
      roomsStore.showOngoingDot = true;
    }

    const notification = new SoundNotification('select-sound');
    notification.notify();
  }
};
