import SoundNotification from '@/services/api/websocket/soundNotification';
import { sendWindowNotification } from '@/utils/notifications';
import { isValidJson } from '@/utils/messages';

export default async (message, { app }) => {
  const { rooms, activeRoom } = app.$store.state.chats.rooms;
  const findRoom = rooms.find((room) => room.uuid === message.room);

  app.$store.dispatch('chats/rooms/bringRoomFront', findRoom);
  if (findRoom) {
    if (app.me.email === message.user?.email) {
      return;
    }

    const notification = new SoundNotification('ping-bing');
    notification.notify();

    if (document.hidden) {
      sendWindowNotification({
        title: message.contact.name,
        message: message.text,
        image: message.media?.[0]?.url,
      });
    }

    const isCurrentRoom =
      app.$route.name === 'room' && app.$route.params.roomId === message.room;
    const isViewModeCurrentRoom =
      app.$route.params.viewedAgent && activeRoom?.uuid === message.room;

    if (isCurrentRoom || isViewModeCurrentRoom) {
      app.$store.dispatch('chats/roomMessages/addMessage', message);
    }

    if (isValidJson(message.text)) return;

    app.$store.dispatch('chats/rooms/addNewMessagesByRoom', {
      room: message.room,
      message: {
        created_on: message.created_on,
        uuid: message.uuid,
        text: message.text,
      },
    });
  }
};
