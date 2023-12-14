import SoundNotification from '@/services/api/websocket/soundNotification';

export default async ({ room, store, me }) => {
  if (!!room.user && room.user.email !== me.email) return;

  store.dispatch('chats/rooms/addRoom', room);
  const notification = new SoundNotification('select-sound');
  notification.notify();
};
