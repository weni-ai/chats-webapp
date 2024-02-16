import SoundNotification from '@/services/api/websocket/soundNotification';

export default async (room, { app }) => {
  if (
    !app.$store.state.chats.rooms.rooms.find((alreadyInRoom) => alreadyInRoom.uuid === room.uuid)
  ) {
    app.$store.dispatch('chats/rooms/addRoom', room);

    if (room.transfer_history?.action === 'transfer') {
      const notification = new SoundNotification('achievement-confirmation');
      notification.notify();
    }
    if (room.transfer_history?.action === 'forward') {
      const notification = new SoundNotification('select-sound');
      notification.notify();
    }
  }

  app.$store.dispatch('chats/rooms/updateRoom', {
    room,
    userEmail: app.me.email,
    routerReplace: () => app.$router.replace({ name: 'home' }),
    viewedAgentEmail: app.viewedAgent.email,
  });

  if (room.unread_msgs === 0) {
    app.$store.dispatch('chats/rooms/resetNewMessagesByRoom', {
      room: room.uuid,
    });
  }
};
