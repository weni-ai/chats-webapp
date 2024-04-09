import SoundNotification from '@/services/api/websocket/soundNotification';

export default async (room, { app }) => {
  if (!!room.user && room.user.email !== app.me.email) return;

  const isExistingRoom = app.$store.state.chats.rooms.rooms.find(
    (mappedRoom) => mappedRoom.uuid === room.uuid,
  );

  if (!isExistingRoom) {
    app.$store.dispatch('chats/rooms/addRoom', room);
    const notification = new SoundNotification('select-sound');
    notification.notify();
  }
};
