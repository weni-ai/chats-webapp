import SoundNotification from '@/services/api/websocket/soundNotification';

export default async (room, { app }) => {
  if (!!room.user && room.user.email !== app.me.email) return;

  app.$route.dispatch('chats/rooms/addRoom', room);
  const notification = new SoundNotification('select-sound');
  notification.notify();
};
