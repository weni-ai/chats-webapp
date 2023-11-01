import { groupMessages, treatMessages } from '@/utils/messages';
import Message from '@/services/api/resources/chats/message';
import Discussions from './discussions';

const mutations = {
  SET_DISCUSSION_MESSAGES: 'SET_DISCUSSION_MESSAGES',
  ADD_DISCUSSION_MESSAGE_SORTED: 'ADD_DISCUSSION_MESSAGE_SORTED',
  RESET_DISCUSSION_MESSAGES_SORTED: 'RESET_DISCUSSION_MESSAGES_SORTED',
  SET_DISCUSSION_MESSAGES_NEXT: 'SET_DISCUSSION_MESSAGES_NEXT',
  RESET_DISCUSSION_MESSAGES_NEXT: 'RESET_DISCUSSION_MESSAGES_NEXT',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  SET_FAILED_MESSAGE: 'SET_FAILED_MESSAGE',
};

export default {
  namespaced: true,
  state: {
    discussionMessages: [],
    discussionMessagesSorted: [],
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

    [mutations.ADD_DISCUSSION_MESSAGE_SORTED](state, { message, addBefore }) {
      groupMessages(state.discussionMessagesSorted, { message, addBefore });
    },
    [mutations.RESET_DISCUSSION_MESSAGES_SORTED](state) {
      state.discussionMessagesSorted = [];
    },
  },

  actions: {
    async getDiscussionMessages({ commit, state }, { offset = null, limit = null }) {
      const nextReq = state.discussionMessagesNext;

      treatMessages({
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
  },
};
