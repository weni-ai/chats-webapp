import SoundNotification from '@/services/api/websocket/soundNotification';
import { sendWindowNotification } from '@/utils/notifications';
import { isValidJson } from '@/utils/messages';

import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useConfig } from '@/store/modules/config';

const checkAndUpdateRoomLastMessage = (room, message) => {
  const itsMessageSystem = !message.contact && !message.user;
  const itsEmptyMessage = !message.text?.trim() && !message.media?.length;

  if (itsMessageSystem) return;

  // Empty messages are generated when media is sent
  // You need to mark the id here to update in the msg.update listen
  if (itsEmptyMessage) {
    room.last_message.uuid = message.uuid;

    return;
  }

  room.last_message = message;
};

export default async (message, { app }) => {
  const roomsStore = useRooms();
  const roomMessagesStore = useRoomMessages();
  const configStore = useConfig();
  const { rooms, activeRoom } = roomsStore;

  const findRoom = rooms.find((room) => room.uuid === message.room);

  roomsStore.bringRoomFront(findRoom);

  if (findRoom) {
    if (app.me.email === message.user?.email) {
      checkAndUpdateRoomLastMessage(findRoom, message);
      return;
    }

    const { enableAutomaticRoomRouting } = configStore;

    if (!enableAutomaticRoomRouting || findRoom?.user?.email === app.me.email) {
      const notification = new SoundNotification('ping-bing');
      notification.notify();

      if (document.hidden && !isValidJson(message.text)) {
        try {
          sendWindowNotification({
            title: message.contact?.name,
            message: message.text,
            image: message.media?.[0]?.url,
          });
        } catch (error) {
          console.log(error);
        }
      }
    }

    const isCurrentRoom =
      app.$route.name === 'room' && app.$route.params.roomId === message.room;
    const isViewModeCurrentRoom =
      app.$route.params.viewedAgent && activeRoom?.uuid === message.room;

    if (isCurrentRoom || isViewModeCurrentRoom) {
      roomMessagesStore.addMessage(message);
    }

    if (!isValidJson(message.text)) {
      checkAndUpdateRoomLastMessage(findRoom, message);
      roomsStore.addNewMessagesByRoom({
        room: message.room,
        message: {
          created_on: message.created_on,
          uuid: message.uuid,
          text: message.text,
        },
      });
    }
  }
};
