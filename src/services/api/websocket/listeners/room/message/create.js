import SoundNotification from '@/services/api/websocket/soundNotification';
import { sendWindowNotification } from '@/utils/notifications';
import { isValidJson } from '@/utils/messages';

export default async ({ message, store, route, me }) => {
  const { rooms, activeRoom } = store.state.chats.rooms;
  const findRoom = rooms.find((room) => room.uuid === message.room);

  store.dispatch('chats/rooms/bringRoomFront', findRoom);
  if (findRoom) {
    if (me.email === message.user?.email) {
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

    const isCurrentRoom = route.name === 'room' && route.params.roomId === message.room;
    const isViewModeCurrentRoom = route.params.viewedAgent && activeRoom?.uuid === message.room;

    if (isCurrentRoom || isViewModeCurrentRoom) {
      store.dispatch('chats/roomMessages/addMessage', message);
    }

    if (isValidJson(message.text)) return;

    store.dispatch('chats/rooms/addNewMessagesByRoom', {
      room: message.room,
      message: {
        created_on: message.created_on,
        uuid: message.uuid,
        text: message.text,
      },
    });
  }
};
