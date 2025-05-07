import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default async (message, { app }) => {
  const roomMessagesStore = useRoomMessages();

  const findedMessage = roomMessagesStore.roomMessages.find(
    ({ uuid }) => uuid === message.uuid,
  );

  if (findedMessage) {
    roomMessagesStore.updateMessage({
      message: { ...findedMessage, status: message.status },
    });
  }
};
