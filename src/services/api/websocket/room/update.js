import SoundNotification from '@/services/api/websocket/soundNotification';

export default async ({ room, store, router, me, viewedAgent }) => {
  if (!store.state.chats.rooms.rooms.find((alreadyInRoom) => alreadyInRoom.uuid === room.uuid)) {
    store.dispatch('chats/rooms/addRoom', room);

    const notification = new SoundNotification('select-sound');
    notification.notify();
  }

  store.dispatch('chats/rooms/updateRoom', {
    room,
    userEmail: me.email,
    routerReplace: () => router.replace({ name: 'home' }),
    viewedAgentEmail: viewedAgent.email,
  });

  if (room.unread_msgs === 0) {
    store.dispatch('chats/rooms/resetNewMessagesByRoom', {
      room: room.uuid,
    });
  }
};
