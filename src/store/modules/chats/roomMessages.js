// import mime from 'mime-types';
import {
  isMessageInActiveRoom,
  isMessageFromCurrentUser,
  groupMessages,
  parseMessageToMessageWithSenderProp,
  treatMessages,
} from '@/utils/messages';
import Message from '@/services/api/resources/chats/message';
import Rooms from './rooms';

const mutations = {
  SET_ROOM_MESSAGES: 'SET_ROOM_MESSAGES',
  ADD_ROOM_MESSAGE_SORTED: 'ADD_ROOM_MESSAGE_SORTED',
  RESET_ROOM_MESSAGES_SORTED: 'RESET_ROOM_MESSAGES_SORTED',
  SET_ROOM_MESSAGES_NEXT: 'SET_ROOM_MESSAGES_NEXT',
  RESET_ROOM_MESSAGES_NEXT: 'RESET_ROOM_MESSAGES_NEXT',
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
function removeMessageFromInPromise({ state }, messageUuid) {
  state.roomMessagesInPromiseUuids = state.roomMessagesInPromiseUuids.filter(
    (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
  );
}

export default {
  namespaced: true,
  state: {
    roomMessages: [],
    roomMessagesSorted: [],
    roomMessagesSendingUuids: [],
    roomMessagesInPromiseUuids: [],
    roomMessagesFailedUuids: [],
    roomMessagesNext: '',
  },

  mutations: {
    [mutations.SET_ROOM_MESSAGES](state, messages) {
      state.roomMessages = messages;
    },

    [mutations.ADD_ROOM_MESSAGE_SORTED](state, { message, addBefore }) {
      groupMessages(state.roomMessagesSorted, { message, addBefore });
    },
    [mutations.RESET_ROOM_MESSAGES_SORTED](state) {
      state.roomMessagesSorted = [];
    },
    [mutations.RESET_ROOM_MESSAGES_NEXT](state) {
      state.roomMessagesNext = '';
    },
    [mutations.SET_ROOM_MESSAGES_NEXT](state, roomMessagesNext) {
      state.roomMessagesNext = roomMessagesNext;
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

  actions: {
    async getRoomMessages({ commit, state }, { offset = null, limit = null }) {
      const nextReq = state.roomMessagesNext;

      await treatMessages({
        itemUuid: Rooms.state.activeRoom?.uuid,
        getItemMessages: () =>
          Message.getByRoom({ nextReq }, Rooms.state.activeRoom?.uuid, offset, limit),
        oldMessages: state.roomMessages,
        nextReq,
        addSortedMessage: ({ message, addBefore }) =>
          commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message, addBefore }),
        resetSortedMessages: () => commit(mutations.RESET_ROOM_MESSAGES_SORTED),
        setMessages: (messages) => commit(mutations.SET_ROOM_MESSAGES, messages),
        setMessagesNext: (next) => commit(mutations.SET_ROOM_MESSAGES_NEXT, next),
      });
    },

    resetRoomMessages({ commit }) {
      commit(mutations.RESET_ROOM_MESSAGES_SORTED);
      commit(mutations.RESET_ROOM_MESSAGES_NEXT);
    },

    async addMessage({ commit, state }, message) {
      const messageAlreadyExists = state.roomMessages.some(
        (mappedMessage) => mappedMessage.uuid === message.uuid,
      );

      if (messageAlreadyExists) commit(mutations.UPDATE_MESSAGE, { message });
      else {
        commit(mutations.ADD_MESSAGE, { message });
        commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message });
      }
    },

    async sendMessage({ commit }, text) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      // Create a temporary message to display while sending
      const temporaryMessage = createTemporaryMessage({ activeRoom, text });
      commit(mutations.ADD_MESSAGE, { message: temporaryMessage });
      commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message: temporaryMessage });

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

      await Promise.all(
        medias.map(async (media) => {
          // Create a temporary message to display while sending
          const mediaPreview = URL.createObjectURL(media);
          const temporaryMessage = createTemporaryMessage({
            activeRoom,
            text: '',
            media: [{ preview: mediaPreview, file: media, content_type: media.type }],
          });
          commit(mutations.ADD_MESSAGE, { message: temporaryMessage });
          commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message: temporaryMessage });

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
        }),
      );
    },

    async resendMessage({ commit, state }, { message }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom || state.roomMessagesInPromiseUuids.includes(message.uuid)) return;

      // Send the message and update it with the actual message data
      try {
        state.roomMessagesInPromiseUuids.push(message.uuid);
        const updatedMessage = await Message.send(activeRoom.uuid, {
          text: message.text,
          user_email: activeRoom.user.email,
          seen: true,
        });
        removeMessageFromInPromise({ state }, message.uuid);

        await commit(mutations.UPDATE_MESSAGE, {
          message: updatedMessage,
          toUpdateMessageUuid: message.uuid,
        });
      } catch (error) {
        removeMessageFromInPromise({ state }, message.uuid);

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

      // Send the media and update it with the actual media data
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
      if (roomMessagesSendingUuids.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const messageUuid of roomMessagesSendingUuids) {
          /*
            As it is important that messages are sent in the same order in which they were
            registered, it is necessary to use this "for...of" as it makes it possible
            to send messages sequentially, synchronously
          */

          const messageIndex = roomMessages.findIndex(
            (mappedMessage) => mappedMessage.uuid === messageUuid,
          );

          // eslint-disable-next-line no-await-in-loop
          await dispatch('resendMessage', { message: roomMessages[messageIndex] });
        }
      }
    },
  },
};
