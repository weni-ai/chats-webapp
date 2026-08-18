import SoundNotification from '@/services/api/websocket/soundNotification';
import { sendWindowNotification } from '@/utils/notifications';
import { isValidJson } from '@/utils/messages';

import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { getRoomType } from '@/utils/room';

const checkAndUpdateRoomLastMessage = (room, message) => {
  const itsMessageSystem =
    !message.contact && !message.user && !message.bulk_message;
  const itsEmptyMessage = !message.text?.trim() && !message.media?.length;

  if (itsMessageSystem) return;

  // Empty messages are generated when media is sent
  // You need to mark the id here to update in the msg.update listen
  if (itsEmptyMessage) {
    room.last_message.uuid = message?.uuid;

    return;
  }

  room.last_message = message;
  room.last_interaction = message.created_on;
};

const isMessageFromMe = (message, meEmail) =>
  meEmail === message.user?.email ||
  meEmail === message.bulk_message?.sent_by?.email;

export default async (message, { app }) => {
  const roomsStore = useRooms();
  const roomMessagesStore = useRoomMessages();
  const { rooms, activeRoom } = roomsStore;

  const findRoom = rooms.find((room) => room.uuid === message.room);

  if (findRoom) {
    const roomType = getRoomType(findRoom);
    const isBulkMessage = !!message.bulk_message;
    const isFromMe = isMessageFromMe(message, app.me.email);
    const isCurrentRoom =
      app.$route.name === 'room' && app.$route.params.roomId === message.room;
    const isViewModeCurrentRoom =
      app.$route.params.viewedAgent && activeRoom?.uuid === message.room;

    if (isFromMe) {
      if (!message.internal_note) {
        checkAndUpdateRoomLastMessage(findRoom, message);
      }

      if (isBulkMessage) {
        if (isCurrentRoom || isViewModeCurrentRoom) {
          roomMessagesStore.addMessage(message);
        }
        return;
      }

      if (!message.is_automatic_message) {
        return;
      }
    }

    if (roomType === 'ongoing' && roomsStore.activeTab !== 'ongoing') {
      roomsStore.showOngoingDot = true;
    }

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
