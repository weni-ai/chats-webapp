import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default async (message) => {
  const roomMessagesStore = useRoomMessages();

  const findedMessage = roomMessagesStore.roomMessages.find(
    ({ uuid }) => uuid === message.uuid,
  );

  if (findedMessage) {
    roomMessagesStore.updateMessageStatus({
      message: findedMessage,
      status: message.status,
    });
  }
};
