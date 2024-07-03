import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default async (message, { app }) => {
  const roomMessagesStore = useRoomMessages();
  if (app.me.email === message.user?.email) {
    return;
  }
  roomMessagesStore.addMessage(message);
};
