// import mime from 'mime-types';
import moment from 'moment';

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
  ADD_ROOM_MESSAGE_SORTED: 'ADD_ROOM_MESSAGE_SORTED',
  RESET_ROOM_MESSAGE_SORTED: 'RESET_ROOM_MESSAGE_SORTED',
  SET_ROOM_MESSAGES_NEXT: 'SET_ROOM_MESSAGES_NEXT',
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
    roomMessagesSorted: [],
    roomMessagesSendingUuids: [],
    roomMessagesFailedUuids: [],
    roomMessagesNext: '',
  },

  mutations: {
    [mutations.SET_ROOM_MESSAGES](state, messages) {
      state.roomMessages = messages;
    },

    /**
     * Adds a message to the roomMessagesSorted data structure.
     *
     * This function is designed to follow the state with the following format:
     * [{
     *   date: "",
     *   minutes: [{
     *     minute: "",
     *     messages: [{
     *       // ... (message data)
     *     }]
     *   }]
     * }]
     *
     * The choice of this format was motivated by the following topics:
     *
     * 1. **Reactivity**: Allows real-time state updates, ensuring that changes
     *    are immediately reflected in observers. This is possible thanks to the use of arrays, as JavaScript
     *    does not observe property mutations in plain objects.
     *
     * 2. **Unshift and Push**: The ability to use `unshift` and `push` makes it easier to add messages in chronological order.
     *
     * 3. **Grouping**: Group messages by date and sending time.
     *
     * @param {object} payload.message - The message to be added.
     * @param {boolean} payload.addBefore - Specifies whether the message should be added before or after existing ones.
     */
    [mutations.ADD_ROOM_MESSAGE_SORTED](state, { message, addBefore }) {
      const messageTimestamp = moment(message.created_on);
      const messageDate = messageTimestamp.format('L');
      const messageMinute = messageTimestamp.format('LT');

      let dateIndex = state.roomMessagesSorted.findIndex((obj) => obj.date === messageDate);

      if (dateIndex === -1) {
        dateIndex = addBefore ? 0 : state.roomMessagesSorted.length;
        const newDateEntry = { date: messageDate, minutes: [] };
        state.roomMessagesSorted.splice(dateIndex, 0, newDateEntry);
      }

      const currentDateEntry = state.roomMessagesSorted[dateIndex];
      let minuteIndex = currentDateEntry.minutes.findIndex((obj) => obj.minute === messageMinute);

      if (minuteIndex === -1) {
        minuteIndex = addBefore ? 0 : currentDateEntry.minutes.length;
        const newMinuteEntry = { minute: messageMinute, messages: [] };
        currentDateEntry.minutes.splice(minuteIndex, 0, newMinuteEntry);
      }

      const currentMinuteEntry = currentDateEntry.minutes[minuteIndex];

      if (addBefore) {
        currentMinuteEntry.messages.unshift(message);
      } else {
        currentMinuteEntry.messages.push(message);
      }
    },
    [mutations.RESET_ROOM_MESSAGE_SORTED](state) {
      state.roomMessagesSorted = [];
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

  getters: {
    groupedActiveRoomsMessage: (state) => {
      return groupSequentialSentMessages(state.roomMessages);
    },
  },

  actions: {
    async getRoomMessages({ commit, state }, { offset = null, concat = false, limit = null }) {
      const { activeRoom } = Rooms.state;

      if (!activeRoom) {
        return;
      }

      const maxRetries = 3;
      let currentRetry = 0;

      const nextReq = state.roomMessagesNext;

      async function fetchData() {
        try {
          const response = await Message.getByRoom({ nextReq }, activeRoom.uuid, offset, limit);

          const { results: messages, next: hasNext } = response;

          if (!messages?.[0] || !activeRoom?.uuid || messages?.[0]?.room !== activeRoom.uuid) {
            return;
          }

          if (nextReq || concat) {
            messages.reverse().forEach((message) => {
              commit(mutations.ADD_ROOM_MESSAGE_SORTED, {
                message,
                addBefore: !!nextReq || concat,
              });
            });
          } else {
            commit(mutations.RESET_ROOM_MESSAGE_SORTED);
            messages.forEach((message) => {
              commit(mutations.ADD_ROOM_MESSAGE_SORTED, { message });
            });
          }

          commit(mutations.SET_ROOM_MESSAGES, messages);
          commit(mutations.SET_ROOM_MESSAGES_NEXT, hasNext);
        } catch (error) {
          console.error('An error ocurred when try get the room messages', error);

          if (currentRetry < maxRetries) {
            currentRetry += 1;

            const TWO_SECONDS = 2000;

            await new Promise((resolve) => {
              setTimeout(() => {
                resolve(fetchData());
              }, TWO_SECONDS);
            });
          } else {
            throw new Error(
              `Several errors occurred when trying to request messages from the room. There will be no automatic retries.`,
            );
          }
        }
      }

      await fetchData();
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
