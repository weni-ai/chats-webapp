import SoundNotification from '@/services/api/websocket/soundNotification';

import { useRooms } from '@/store/modules/chats/rooms';

export default async (room, { app }) => {
  const roomsStore = useRooms();
  const isExistingRoom = roomsStore.rooms.find(
    (mappedRoom) => mappedRoom.uuid === room.uuid,
  );

  if (!isExistingRoom) {
    roomsStore.addRoom(room);

    if (room.transfer_history?.action === 'transfer') {
      const notification = new SoundNotification('achievement-confirmation');
      notification.notify();
    }
    if (room.transfer_history?.action === 'forward') {
      const notification = new SoundNotification('select-sound');
      notification.notify();
    }
  }
  roomsStore.updateRoom({
    room,
    userEmail: app.me.email,
    routerReplace: () => app.$router.replace({ name: 'home' }),
    viewedAgentEmail: app.viewedAgent.email,
  });

  if (room.unread_msgs === 0) {
    roomsStore.resetNewMessagesByRoom({
      room: room.uuid,
    });
  }
};
