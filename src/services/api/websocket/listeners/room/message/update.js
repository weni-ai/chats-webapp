import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useRooms } from '@/store/modules/chats/rooms';
import { updateInternalNoteMessage } from '@/utils/messages';

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

  const isInternalNote = !!message.internal_note;

  if (isInternalNote) {
    const uuidInternalNoteMessage = `internal-note-${message.internal_note.uuid}`;
    updateInternalNoteMessage(roomMessagesStore.roomMessagesSorted, {
      message: { ...message, uuid: uuidInternalNoteMessage },
    });
  }

  if (app.me.email === message.user?.email) {
    return;
  }

  roomMessagesStore.addMessage(message);
};
