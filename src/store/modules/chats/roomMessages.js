// import mime from 'mime-types';
import {
  isMessageFromCurrentUser,
  groupMessages,
  parseMessageToMessageWithSenderProp,
  treatMessages,
  sendMessage,
  sendMedias,
  resendMedia,
  resendMessage,
} from '@/utils/messages';
import Message from '@/services/api/resources/chats/message';
import Rooms from './rooms';

const mutations = {
  SET_ROOM_MESSAGES: 'SET_ROOM_MESSAGES',
  ADD_ROOM_MESSAGE_SORTED: 'ADD_ROOM_MESSAGE_SORTED',
  RESET_ROOM_MESSAGES_SORTED: 'RESET_ROOM_MESSAGES_SORTED',
  SET_ROOM_MESSAGES_NEXT: 'SET_ROOM_MESSAGES_NEXT',
  SET_ROOM_MESSAGES_PREVIOUS: 'SET_ROOM_MESSAGES_PREVIOUS',
  RESET_ROOM_MESSAGES_NEXT: 'RESET_ROOM_MESSAGES_NEXT',
  RESET_ROOM_MESSAGES_PREVIOUS: 'RESET_ROOM_MESSAGES_PREVIOUS',
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
    roomMessagesPrevious: '',
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
    [mutations.SET_ROOM_MESSAGES_NEXT](state, roomMessagesNext) {
      state.roomMessagesNext = roomMessagesNext;
    },
    [mutations.RESET_ROOM_MESSAGES_NEXT](state) {
      state.roomMessagesNext = '';
    },
    [mutations.SET_ROOM_MESSAGES_PREVIOUS](state, roomMessagesPrevious) {
      state.roomMessagesPrevious = roomMessagesPrevious;
    },
    [mutations.RESET_ROOM_MESSAGES_PREVIOUS](state) {
      state.roomMessagesPrevious = '';
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

      const updatedMessage =
        parseMessageToMessageWithSenderProp(treatedMessage);

      const messageIndex = roomMessages.findIndex(
        (mappedMessage) => mappedMessage.uuid === uuid,
      );
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
          Message.getByRoom(
            { nextReq },
            Rooms.state.activeRoom?.uuid,
            offset,
            limit,
          ),
        oldMessages: state.roomMessages,
        nextReq,
        addSortedMessage: ({ message, addBefore }) =>
          commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message, addBefore }),
        resetSortedMessages: () => commit(mutations.RESET_ROOM_MESSAGES_SORTED),
        setMessages: (messages) =>
          commit(mutations.SET_ROOM_MESSAGES, messages),
        setMessagesNext: (next) =>
          commit(mutations.SET_ROOM_MESSAGES_NEXT, next),
        setMessagesPrevious: (previous) =>
          commit(mutations.SET_ROOM_MESSAGES_PREVIOUS, previous),
      });
    },

    resetRoomMessages({ commit }) {
      commit(mutations.RESET_ROOM_MESSAGES_SORTED);
      commit(mutations.RESET_ROOM_MESSAGES_NEXT);
      commit(mutations.RESET_ROOM_MESSAGES_PREVIOUS);
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
        addSortedMessage: (message) =>
          commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message }),
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
        addSortedMessage: (message) =>
          commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message }),
        addFailedMessage: (message) =>
          commit(mutations.ADD_FAILED_MESSAGE, {
            message,
          }),
        updateMessage: ({
          media,
          message,
          toUpdateMessageUuid,
          toUpdateMediaPreview,
        }) =>
          commit(mutations.UPDATE_MESSAGE, {
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
    },

    async resendRoomMessage({ commit, state }, { message }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      await resendMessage({
        itemUuid: activeRoom.uuid,
        message,
        sendItemMessage: () =>
          Message.sendRoomMessage(activeRoom.uuid, {
            text: message.text,
            user_email: activeRoom.user.email,
            seen: true,
          }),
        updateMessage: ({ message, toUpdateMessageUuid }) =>
          commit(mutations.UPDATE_MESSAGE, { message, toUpdateMessageUuid }),
        messagesInPromiseUuids: state.roomMessagesInPromiseUuids,
        removeInPromiseMessage: (message) =>
          removeMessageFromInPromise({ state }, message),
      });
    },

    async resendRoomMedia({ commit, state }, { message, media }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      await resendMedia({
        itemUuid: activeRoom.uuid,
        message,
        media,
        sendItemMedia: (media) =>
          Message.sendRoomMedia(activeRoom.uuid, {
            user_email: activeRoom.user.email,
            media: media.file,
          }),
        addFailedMessage: (message) =>
          commit(mutations.ADD_FAILED_MESSAGE, {
            message,
          }),
        removeFailedMessage: (message) =>
          removeMessageFromFaileds({ state }, message),
        addSendingMessage: (message) =>
          state.roomMessagesSendingUuids.push(message),
        updateMessage: ({
          media,
          message,
          toUpdateMessageUuid,
          toUpdateMediaPreview,
        }) =>
          commit(mutations.UPDATE_MESSAGE, {
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
    },

    async resendRoomMessages({ state, dispatch }) {
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
          await dispatch('resendRoomMessage', {
            message: roomMessages[messageIndex],
          });
        }
      }
    },
  },
};
