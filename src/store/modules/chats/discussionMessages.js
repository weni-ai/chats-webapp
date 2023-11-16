import {
  groupMessages,
  isMessageFromCurrentUser,
  parseMessageToMessageWithSenderProp,
  sendMedias,
  sendMessage,
  treatMessages,
} from '@/utils/messages';
import Message from '@/services/api/resources/chats/message';
import Discussions from './discussions';
import Profile from '../profile';

const mutations = {
  SET_DISCUSSION_MESSAGES: 'SET_DISCUSSION_MESSAGES',
  ADD_DISCUSSION_MESSAGE: 'ADD_DISCUSSION_MESSAGE',
  ADD_DISCUSSION_MESSAGE_SORTED: 'ADD_DISCUSSION_MESSAGE_SORTED',
  RESET_DISCUSSION_MESSAGES_SORTED: 'RESET_DISCUSSION_MESSAGES_SORTED',
  SET_DISCUSSION_MESSAGES_NEXT: 'SET_DISCUSSION_MESSAGES_NEXT',
  RESET_DISCUSSION_MESSAGES_NEXT: 'RESET_DISCUSSION_MESSAGES_NEXT',
  UPDATE_DISCUSSION_MESSAGE: 'UPDATE_DISCUSSION_MESSAGE',
  ADD_FAILED_DISCUSSION_MESSAGE: 'ADD_FAILED_DISCUSSION_MESSAGE',
};

function isMessageInActiveDiscussion(message) {
  const { activeDiscussion } = Discussions.state;
  return message.discussion === activeDiscussion?.uuid;
}

function removeMessageFromSendings({ state }, messageUuid) {
  state.discussionMessagesSendingUuids = state.discussionMessagesSendingUuids.filter(
    (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
  );
}

export default {
  namespaced: true,
  state: {
    discussionMessages: [],
    discussionMessagesSorted: [],
    discussionMessagesSendingUuids: [],
    discussionMessagesInPromiseUuids: [],
    discussionMessagesFailedUuids: [],
    discussionMessagesNext: '',
  },

  mutations: {
    [mutations.SET_DISCUSSION_MESSAGES](state, messages) {
      state.discussionMessages = messages;
    },
    [mutations.SET_DISCUSSION_MESSAGES_NEXT](state, discussionMessagesNext) {
      state.discussionMessagesNext = discussionMessagesNext;
    },
    [mutations.RESET_DISCUSSION_MESSAGES_NEXT](state) {
      state.discussionMessagesNext = '';
    },

    [mutations.ADD_DISCUSSION_MESSAGE](state, { message }) {
      const { discussionMessages, discussionMessagesSendingUuids } = state;
      const { uuid } = message;

      if (isMessageInActiveDiscussion(message)) {
        const messageWithSender = parseMessageToMessageWithSenderProp(message);

        discussionMessages.push(messageWithSender);

        if (isMessageFromCurrentUser(message)) {
          discussionMessagesSendingUuids.push(uuid);
        }
      }
    },
    [mutations.ADD_FAILED_DISCUSSION_MESSAGE](state, { message }) {
      const { roomMessagesFailedUuids } = state;
      const { uuid } = message;

      if (isMessageInActiveDiscussion(message)) {
        removeMessageFromSendings({ state }, uuid);

        if (isMessageFromCurrentUser(message)) {
          roomMessagesFailedUuids.push(uuid);
        }
      }
    },
    [mutations.UPDATE_DISCUSSION_MESSAGE](
      state,
      { media, toUpdateMediaPreview, message, toUpdateMessageUuid = '' },
    ) {
      const { discussionMessages } = state;
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

      const messageIndex = discussionMessages.findIndex(
        (mappedMessage) => mappedMessage.uuid === uuid,
      );
      if (messageIndex !== -1) {
        discussionMessages[messageIndex] = updatedMessage;
      }

      removeMessageFromSendings({ state }, uuid);
    },
    [mutations.ADD_DISCUSSION_MESSAGE_SORTED](state, { message, addBefore }) {
      groupMessages(state.discussionMessagesSorted, { message, addBefore });
    },
    [mutations.RESET_DISCUSSION_MESSAGES_SORTED](state) {
      state.discussionMessagesSorted = [];
    },
  },

  actions: {
    async getDiscussionMessages({ commit, state }, { offset, limit }) {
      const nextReq = state.discussionMessagesNext;

      await treatMessages({
        itemUuid: Discussions.state.activeDiscussion?.uuid,
        getItemMessages: () =>
          Message.getByDiscussion(
            { nextReq },
            Discussions.state.activeDiscussion.uuid,
            offset,
            limit,
          ),
        oldMessages: state.discussionMessages,
        nextReq,
        addSortedMessage: ({ message, addBefore }) =>
          commit(mutations.ADD_DISCUSSION_MESSAGE_SORTED, { message, addBefore }),
        resetSortedMessages: () => commit(mutations.RESET_DISCUSSION_MESSAGES_SORTED),
        setMessages: (messages) => commit(mutations.SET_DISCUSSION_MESSAGES, messages),
        setMessagesNext: (next) => commit(mutations.SET_DISCUSSION_MESSAGES_NEXT, next),
      });
    },

    resetDiscussionMessages({ commit }) {
      commit(mutations.RESET_DISCUSSION_MESSAGES_SORTED);
      commit(mutations.RESET_DISCUSSION_MESSAGES_NEXT);
    },

    async addDiscussionMessage({ commit, state }, message) {
      const messageAlreadyExists = state.discussionMessages.some(
        (mappedMessage) => mappedMessage.uuid === message.uuid,
      );

      if (messageAlreadyExists) commit(mutations.UPDATE_DISCUSSION_MESSAGE, { message });
      else {
        commit(mutations.ADD_DISCUSSION_MESSAGE, { message });
        commit(mutations.ADD_DISCUSSION_MESSAGE_SORTED, { message });
      }
    },

    async sendDiscussionMessage({ commit }, text) {
      const { activeDiscussion } = Discussions.state;
      if (!activeDiscussion) return;

      const me = { ...Profile.state.me };

      await sendMessage({
        itemType: 'discussion',
        itemUuid: activeDiscussion.uuid,
        itemUser: activeDiscussion.user || me,
        message: text,
        sendItemMessage: () =>
          Message.sendDiscussionMessage(activeDiscussion.uuid, {
            text,
          }),
        addMessage: (message) => commit(mutations.ADD_DISCUSSION_MESSAGE, { message }),
        addSortedMessage: (message) => commit(mutations.ADD_DISCUSSION_MESSAGE_SORTED, { message }),
        updateMessage: ({ message, toUpdateMessageUuid }) =>
          commit(mutations.UPDATE_DISCUSSION_MESSAGE, { message, toUpdateMessageUuid }),
      });
    },

    async sendDiscussionMedias({ commit }, { files: medias, updateLoadingFiles }) {
      const { activeDiscussion } = Discussions.state;
      if (!activeDiscussion) return;

      const me = { ...Profile.state.me };

      await sendMedias({
        itemType: 'discussion',
        itemUuid: activeDiscussion.uuid,
        itemUser: activeDiscussion.user || me,
        medias,
        sendItemMedia: (media) =>
          Message.sendDiscussionMedia(activeDiscussion.uuid, {
            media,
            updateLoadingFiles,
          }),
        addMessage: (message) => commit(mutations.ADD_DISCUSSION_MESSAGE, { message }),
        addSortedMessage: (message) => commit(mutations.ADD_DISCUSSION_MESSAGE_SORTED, { message }),
        addFailedMessage: (message) =>
          commit(mutations.ADD_FAILED_DISCUSSION_MESSAGE, {
            message,
          }),
        updateMessage: ({ media, message, toUpdateMessageUuid, toUpdateMediaPreview }) =>
          commit(mutations.UPDATE_DISCUSSION_MESSAGE, {
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
    },
  },
};
