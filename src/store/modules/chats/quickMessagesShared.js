import QuickMessage from '@/services/api/resources/chats/quickMessage';

const mutations = {
  SET_QUICK_MESSAGES_SHARED: 'SET_QUICK_MESSAGES_SHARED',
  ADD_QUICK_MESSAGE_SHARED: 'ADD_QUICK_MESSAGE_SHARED',
  UPDATE_QUICK_MESSAGE_SHARED: 'UPDATE_QUICK_MESSAGE_SHARED',
  DELETE_QUICK_MESSAGE_SHARED: 'DELETE_QUICK_MESSAGE_SHARED',
  SET_NEXT_QUICK_MESSAGES_SHARED: 'SET_NEXT_QUICK_MESSAGES_SHARED',
};

export default {
  namespaced: true,

  state: {
    quickMessagesShared: [],
    nextQuickMessagesShared: '',
  },

  mutations: {
    [mutations.SET_QUICK_MESSAGES_SHARED](state, quickMessagesShared) {
      state.quickMessagesShared = quickMessagesShared;
    },
    [mutations.ADD_QUICK_MESSAGE_SHARED](state, quickMessagesShared) {
      state.quickMessagesShared.unshift({ ...quickMessagesShared });
    },
    [mutations.SET_NEXT_QUICK_MESSAGES_SHARED](state, nextQuickMessagesShared) {
      state.nextQuickMessagesShared = nextQuickMessagesShared;
    },
  },

  actions: {
    async getAll({ commit, state }) {
      const { quickMessagesShared, nextQuickMessagesShared } = state;

      const response = await QuickMessage.getAllBySector({ nextQuickMessagesShared });
      const responseNext = response.next;
      const newQuickMessagesShared = [...quickMessagesShared, ...response.results] || [];

      commit(mutations.SET_NEXT_QUICK_MESSAGES_SHARED, responseNext);
      commit(mutations.SET_QUICK_MESSAGES_SHARED, newQuickMessagesShared);

      return newQuickMessagesShared;
    },
  },
};
