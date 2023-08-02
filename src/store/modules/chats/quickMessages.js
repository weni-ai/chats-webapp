import QuickMessage from '@/services/api/resources/chats/quickMessage';

const mutations = {
  SET_QUICK_MESSAGES: 'SET_QUICK_MESSAGES',
  ADD_QUICK_MESSAGE: 'ADD_QUICK_MESSAGE',
  UPDATE_QUICK_MESSAGE: 'UPDATE_QUICK_MESSAGE',
  DELETE_QUICK_MESSAGE: 'DELETE_QUICK_MESSAGE',
  SET_NEXT_QUICK_MESSAGES: 'SET_NEXT_QUICK_MESSAGES',
};

export default {
  namespaced: true,

  state: {
    quickMessages: [],
    nextQuickMessages: '',
  },

  mutations: {
    [mutations.SET_QUICK_MESSAGES](state, quickMessages) {
      state.quickMessages = quickMessages;
    },
    [mutations.ADD_QUICK_MESSAGE](state, quickMessage) {
      state.quickMessages.unshift({ ...quickMessage });
    },
    [mutations.SET_NEXT_QUICK_MESSAGES](state, nextQuickMessages) {
      state.nextQuickMessages = nextQuickMessages;
    },
  },

  actions: {
    async getAll({ commit, state }) {
      const { quickMessages, nextQuickMessages } = state;

      const response = await QuickMessage.getAll({ nextQuickMessages });
      const responseNext = response.next;
      const newQuickMessages = [...quickMessages, ...response.results] || [];

      commit(mutations.SET_NEXT_QUICK_MESSAGES, responseNext);
      commit(mutations.SET_QUICK_MESSAGES, newQuickMessages);

      return newQuickMessages;
    },
  },
};
