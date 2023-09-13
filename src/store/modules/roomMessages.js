// import mime from 'mime-types';
import {
  isMessageInActiveRoom,
  isMessageFromCurrentUser,
  groupSequentialSentMessages,
  parseMessageToMessageWithSenderProp,
} from '@/utils/messages';
import Message from '@/services/api/resources/chats/message';
import Rooms from './rooms';

const mutations = {
  SET_ROOM_MESSAGES: 'SET_ROOM_MESSAGES',
  SET_ROOM_HAS_NEXT_MESSAGES: 'SET_ROOM_HAS_NEXT_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  SET_FAILED_MESSAGE: 'SET_FAILED_MESSAGE',
};

function createTemporaryMessage({ activeRoom, text = '', media = [] }) {
  return {
    uuid: Date.now().toString(),
    text,
    created_on: new Date().toISOString(),
    media,
    room: activeRoom.uuid,
    seen: true,
    user: { ...activeRoom.user },
  };
}

function removeMessageFromSendings({ state }, messageUuid) {
  state.roomMessagesSendingUuids = state.roomMessagesSendingUuids.filter(
    (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
  );
}

function removeMessageFromFaileds({ state }, messageUuid) {
  state.roomMessagesFailedUuids = state.roomMessagesFailedUuids.filter(
    (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
  );
}

export default {
  namespaced: true,
  state: {
    roomMessages: [],
    roomMessagesSendingUuids: [],
    roomMessagesFailedUuids: [],
    hasNextMessages: true,
  },

  mutations: {
    [mutations.SET_ROOM_MESSAGES](state, messages) {
      state.roomMessages = messages;
    },
    [mutations.SET_ROOM_HAS_NEXT_MESSAGES](state, hasNextMessages) {
      state.hasNextMessages = hasNextMessages;
    },
    [mutations.ADD_MESSAGE](state, { message }) {
      const { roomMessages, roomMessagesSendingUuids } = state;
      const { uuid } = message;

      if (isMessageInActiveRoom(message)) {
        const messageWithSender = parseMessageToMessageWithSenderProp(message);

        roomMessages.push(messageWithSender);

        if (isMessageFromCurrentUser(message)) {
          roomMessagesSendingUuids.push(uuid);
        }
      }
    },
    [mutations.SET_FAILED_MESSAGE](state, { message }) {
      const { roomMessagesFailedUuids } = state;
      const { uuid } = message;

      if (isMessageInActiveRoom(message)) {
        removeMessageFromSendings({ state }, uuid);

        if (isMessageFromCurrentUser(message)) {
          roomMessagesFailedUuids.push(uuid);
        }
      }
    },
    [mutations.UPDATE_MESSAGE](
      state,
      { media, toUpdateMediaPreview, message, toUpdateMessageUuid = '' },
    ) {
      const { roomMessages } = state;
      const uuid = toUpdateMessageUuid || message.uuid;
      const treatedMessage = { ...message };

      if (media) {
        const mediaIndex = treatedMessage.media.findIndex(
          (mappedMessage) => mappedMessage.preview === toUpdateMediaPreview,
        );
        if (mediaIndex !== -1) {
          treatedMessage.media[mediaIndex] = media;
        }
      }

      const updatedMessage = parseMessageToMessageWithSenderProp(treatedMessage);

      const messageIndex = roomMessages.findIndex((mappedMessage) => mappedMessage.uuid === uuid);
      if (messageIndex !== -1) {
        roomMessages[messageIndex] = updatedMessage;
      }

      removeMessageFromSendings({ state }, uuid);
    },
  },

  getters: {
    groupedActiveRoomsMessage: (state) => {
      return groupSequentialSentMessages(state.roomMessages);
    },
  },

  actions: {
    async getRoomMessages({ commit, state }, { offset, concat, limit }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;
      const response = await Message.getByRoom(activeRoom.uuid, offset, limit);
      let messages = response.results;
      const hasNext = response.next;
      if (concat) {
        messages = response.results.concat(state.roomMessages);
      }
      const messagesWithSender = messages.map(parseMessageToMessageWithSenderProp);
      commit(mutations.SET_ROOM_MESSAGES, messagesWithSender);
      commit(mutations.SET_ROOM_HAS_NEXT_MESSAGES, hasNext);
    },

    async addMessage({ commit, state }, message) {
      const messageAlreadyExists = state.roomMessages.some(
        (mappedMessage) => mappedMessage.uuid === message.uuid,
      );

      if (messageAlreadyExists) commit(mutations.UPDATE_MESSAGE, { message });
      else commit(mutations.ADD_MESSAGE, { message });
    },

    async sendMessage({ commit }, text) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      // Create a temporary message to display while sending
      const temporaryMessage = createTemporaryMessage({ activeRoom, text });
      commit(mutations.ADD_MESSAGE, { message: temporaryMessage });

      // Send the message and update it with the actual message data
      try {
        const message = await Message.send(activeRoom.uuid, {
          text,
          user_email: activeRoom.user.email,
          seen: true,
        });
        commit(mutations.UPDATE_MESSAGE, { message, toUpdateMessageUuid: temporaryMessage.uuid });
      } catch (error) {
        console.error('An error occurred while sending the message', error);
      }
    },

    async sendMedias({ commit }, { files: medias, updateLoadingFiles }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      medias.forEach(async (media) => {
        // Create a temporary message to display while sending
        const mediaPreview = URL.createObjectURL(media);
        const temporaryMessage = createTemporaryMessage({
          activeRoom,
          text: '',
          media: [{ preview: mediaPreview, file: media, content_type: media.type }],
        });
        commit(mutations.ADD_MESSAGE, { message: temporaryMessage });

        // Send the message and update it with the actual message data
        try {
          const sentMedia = await Message.sendMedia(activeRoom.uuid, {
            user_email: activeRoom.user.email,
            media,
            updateLoadingFiles,
          });
          commit(mutations.UPDATE_MESSAGE, {
            media: sentMedia,
            message: temporaryMessage,
            toUpdateMediaPreview: mediaPreview,
            toUpdateMessageUuid: temporaryMessage.uuid,
          });
        } catch (error) {
          commit(mutations.SET_FAILED_MESSAGE, {
            message: temporaryMessage,
          });
          console.error('An error occurred while sending the media', error);
        }
      });
    },

    async resendMessage({ commit }, { message }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      // Send the message and update it with the actual message data
      try {
        const updatedMessage = await Message.send(activeRoom.uuid, {
          text: message.text,
          user_email: activeRoom.user.email,
          seen: true,
        });
        commit(mutations.UPDATE_MESSAGE, {
          message: updatedMessage,
          toUpdateMessageUuid: message.uuid,
        });
      } catch (error) {
        console.error('An error occurred while sending the message', error);
      }
    },

    async resendMedia({ commit, state }, { message, media }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      if (isMessageFromCurrentUser(message)) {
        removeMessageFromFaileds({ state }, message.uuid);
        state.roomMessagesSendingUuids.push(message.uuid);
      }

      // Send the message and update it with the actual message data
      try {
        const updatedMedia = await Message.sendMedia(activeRoom.uuid, {
          user_email: activeRoom.user.email,
          media: media.file,
        });
        commit(mutations.UPDATE_MESSAGE, {
          media: updatedMedia,
          message,
          toUpdateMediaPreview: media.preview,
          toUpdateMessageUuid: message.uuid,
        });
      } catch (error) {
        commit(mutations.SET_FAILED_MESSAGE, {
          message,
        });
        console.error('An error occurred while sending the message', error);
      }
    },

    async resendMessages({ state, dispatch }) {
      const { roomMessagesSendingUuids, roomMessages } = state;
      if (roomMessagesSendingUuids > 0) {
        roomMessagesSendingUuids.forEach((messageUuid) => {
          const messageIndex = roomMessages.findIndex(
            (mappedMessage) => mappedMessage.uuid === messageUuid,
          );
          dispatch('resendMessage', { message: roomMessages[messageIndex] });
        });
      }
    },
  },
};
