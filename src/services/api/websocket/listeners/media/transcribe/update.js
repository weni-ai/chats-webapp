import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default (transcription) => {
  const roomMessagesStore = useRoomMessages();
  const existingMessage = roomMessagesStore.roomMessages.find(
    (message) => message.uuid === transcription.message_uuid,
  );

  if (!existingMessage) return;

  if (existingMessage.media[0]) {
    const transcriptionData = {
      text: transcription.text,
      status: transcription.status,
    };
    const newMedia = {
      ...existingMessage.media[0],
      transcription: { ...transcriptionData },
    };

    existingMessage.media[0] = newMedia;

    roomMessagesStore.updateMessage({
      reorderMessageMinute: true,
      message: existingMessage,
    });
  }
};
