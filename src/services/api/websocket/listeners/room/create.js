import SoundNotification from '@/services/api/websocket/soundNotification';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import { useDashboard } from '@/store/modules/dashboard';
import { getRoomType } from '@/utils/room';

export default async (room, { app }) => {
  const roomsStore = useRooms();
  if (!!room.user && room.user.email !== app.me.email) return;

  const isExistingRoom = roomsStore.rooms.find(
    (mappedRoom) => mappedRoom.uuid === room.uuid,
  );

  if (!isExistingRoom) {
    const dashboardStore = useDashboard();
    const isViewMode = dashboardStore.viewedAgent.email !== '';
    const roomType = getRoomType(room);

    const isWaitingRoom = roomType === 'waiting';
    const emptyQueuesFilter = roomsStore.filterQueues.length === 0;
    const isValidRoomFilterQueue =
      emptyQueuesFilter || roomsStore.filterQueues.includes(room.queue?.uuid);

    if (!isValidRoomFilterQueue && (isViewMode || isWaitingRoom)) {
      return;
    }

    const addAfter = !roomsStore.orderBy[roomType].includes('-');
    roomsStore.addRoom(room, { after: addAfter });

    if (roomType === 'ongoing') {
      roomsStore.markNewChatReceived(room.uuid);
    }

    const counters = useRoomCounters();
    counters.handleCreate(roomType);

    if (roomType === 'ongoing' && roomsStore.activeTab !== 'ongoing') {
      roomsStore.showOngoingDot = true;
    }

    const notification = new SoundNotification('select-sound');
    notification.notify();
  }
};
