import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useRooms } from '@/store/modules/chats/rooms';

const checkAndUpdateLastMessage = (room, message) => {
  if (room.last_message?.uuid === message.uuid) {
    room.last_message = message;
  }
};

export default async (message, { app }) => {
  const roomsStore = useRooms();
  const roomMessagesStore = useRoomMessages();

  const findedRoom = roomsStore.rooms.find(
    (room) => room.uuid === message.room,
  );

  if (findedRoom) checkAndUpdateLastMessage(findedRoom, message);

  if (app.me.email === message.user?.email) {
    return;
  }

  roomMessagesStore.addMessage(message);
};
