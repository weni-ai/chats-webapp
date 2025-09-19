import { removeFromGroupedMessages } from '@/utils/messages';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default (note) => {
  const roomMessagesStore = useRoomMessages();
  console.log(note);

  roomMessagesStore.roomInternalNotes =
    roomMessagesStore.roomInternalNotes.filter(
      (mappedNote) => mappedNote.uuid !== note.uuid,
    );

  const internalNoteMessage = roomMessagesStore.roomMessages.find(
    (message) => message.internal_note?.uuid === note.uuid,
  );

  if (internalNoteMessage) {
    removeFromGroupedMessages(roomMessagesStore.roomMessagesSorted, {
      message: internalNoteMessage,
    });

    roomMessagesStore.roomMessages = roomMessagesStore.roomMessages.filter(
      (message) => message.uuid !== internalNoteMessage.uuid,
    );
  }
};
