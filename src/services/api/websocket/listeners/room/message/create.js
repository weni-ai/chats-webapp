import SoundNotification from '@/services/api/websocket/soundNotification';
import { sendWindowNotification } from '@/utils/notifications';
import { isValidJson } from '@/utils/messages';

import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default async (message, { app }) => {
  const roomsStore = useRooms();
  const roomMessagesStore = useRoomMessages();
  const { rooms, activeRoom } = roomsStore;
  const findedRoom = rooms.find((room) => room.uuid === message.room);
  roomsStore.bringRoomFront(findedRoom);

  if (findedRoom) {
    findedRoom.last_message = message.text;
    if (app.me.email === message.user?.email) {
      return;
    }

    const notification = new SoundNotification('ping-bing');
    notification.notify();

    if (document.hidden) {
      sendWindowNotification({
        title: message.contact?.name || '',
        message: message.text,
        image: message.media?.[0]?.url,
      });
    }

    const isCurrentRoom =
      app.$route.name === 'room' && app.$route.params.roomId === message.room;
    const isViewModeCurrentRoom =
      app.$route.params.viewedAgent && activeRoom?.uuid === message.room;

    if (isCurrentRoom || isViewModeCurrentRoom) {
      roomMessagesStore.addMessage(message);
    }

    if (isValidJson(message.text)) return;

    roomsStore.addNewMessagesByRoom({
      room: message.room,
      message: {
        created_on: message.created_on,
        uuid: message.uuid,
        text: message.text,
      },
    });
  }
};
