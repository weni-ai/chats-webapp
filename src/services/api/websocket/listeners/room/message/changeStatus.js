import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default async (message) => {
  const roomMessagesStore = useRoomMessages();
  roomMessagesStore.updateMessageStatus({
    messageUuid: message.uuid,
    status: message.status,
  });
};
