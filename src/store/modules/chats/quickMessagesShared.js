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
    [mutations.ADD_QUICK_MESSAGE_SHARED](state, quickMessage) {
      state.quickMessagesShared.unshift(quickMessage);
      console.log();
    },
    [mutations.UPDATE_QUICK_MESSAGE_SHARED](state, { uuid, title, text, shortcut }) {
      const quickMessageToUpdate = state.quickMessagesShared.find(
        (quickMessage) => quickMessage.uuid === uuid,
      );

      if (quickMessageToUpdate) {
        const updatedQuickMessageShared = {
          ...quickMessageToUpdate,
          title,
          text,
          shortcut,
        };

        state.quickMessagesShared = state.quickMessagesShared.map((quickMessage) =>
          quickMessage.uuid === uuid ? updatedQuickMessageShared : quickMessage,
        );
      }
    },
    [mutations.DELETE_QUICK_MESSAGE_SHARED](state, uuid) {
      state.quickMessagesShared = state.quickMessagesShared.filter(
        (quickMessage) => quickMessage.uuid !== uuid,
      );
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

    async create({ commit }, { sectorUuid, title, text, shortcut }) {
      const newQuickMessageShared = { sectorUuid, title, text, shortcut };
      const response = await QuickMessage.createBySector(newQuickMessageShared);

      commit(mutations.ADD_QUICK_MESSAGE_SHARED, response);
    },

    async update({ commit }, { quickMessageUuid, title, text, shortcut }) {
      const dataToUpdate = { title, text, shortcut };
      await QuickMessage.updateBySector(quickMessageUuid, dataToUpdate);

      commit(mutations.UPDATE_QUICK_MESSAGE_SHARED, { uuid: quickMessageUuid, ...dataToUpdate });
    },

    async delete({ commit }, quickMessageUuid) {
      await QuickMessage.deleteBySector(quickMessageUuid);

      commit(mutations.DELETE_QUICK_MESSAGE_SHARED, quickMessageUuid);
    },
  },
};
