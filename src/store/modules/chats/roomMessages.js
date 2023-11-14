// import mime from 'mime-types';
import {
  isMessageFromCurrentUser,
  groupMessages,
  parseMessageToMessageWithSenderProp,
  treatMessages,
  sendMessage,
  sendMedias,
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
  ADD_FAILED_MESSAGE: 'ADD_FAILED_MESSAGE',
};

function isMessageInActiveRoom(message) {
  const { activeRoom } = Rooms.state;
  return message.room === activeRoom?.uuid;
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
    [mutations.ADD_FAILED_MESSAGE](state, { message }) {
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

    async sendRoomMessage({ commit }, text) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      await sendMessage({
        itemType: 'room',
        itemUuid: activeRoom.uuid,
        itemUser: activeRoom.user,
        message: text,
        sendItemMessage: () =>
          Message.sendRoomMessage(activeRoom.uuid, {
            text,
            user_email: activeRoom.user.email,
            seen: true,
          }),
        addMessage: (message) => commit(mutations.ADD_MESSAGE, { message }),
        addSortedMessage: (message) => commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message }),
        updateMessage: ({ message, toUpdateMessageUuid }) =>
          commit(mutations.UPDATE_MESSAGE, { message, toUpdateMessageUuid }),
      });
    },

    async sendRoomMedias({ commit }, { files: medias, updateLoadingFiles }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      await sendMedias({
        itemType: 'room',
        itemUuid: activeRoom.uuid,
        itemUser: activeRoom.user,
        medias,
        sendItemMedia: (media) =>
          Message.sendRoomMedia(activeRoom.uuid, {
            user_email: activeRoom.user.email,
            media,
            updateLoadingFiles,
          }),
        addMessage: (message) => commit(mutations.ADD_MESSAGE, { message }),
        addSortedMessage: (message) => commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message }),
        addFailedMessage: (message) =>
          commit(mutations.ADD_FAILED_MESSAGE, {
            message,
          }),
        updateMessage: ({ media, message, toUpdateMessageUuid, toUpdateMediaPreview }) =>
          commit(mutations.UPDATE_MESSAGE, {
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
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
        commit(mutations.ADD_FAILED_MESSAGE, {
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
