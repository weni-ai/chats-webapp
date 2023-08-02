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
    [mutations.ADD_QUICK_MESSAGE](state, { title, text, shortcut }) {
      state.quickMessages.unshift({ title, text, shortcut });
    },
    [mutations.UPDATE_QUICK_MESSAGE](state, { uuid, title, text, shortcut }) {
      const quickMessageToUpdate = state.quickMessages.find(
        (quickMessage) => quickMessage.uuid === uuid,
      );

      if (quickMessageToUpdate) {
        const updatedQuickMessage = {
          ...quickMessageToUpdate,
          title,
          text,
          shortcut,
        };

        state.quickMessages = state.quickMessages.map((quickMessage) =>
          quickMessage.uuid === uuid ? updatedQuickMessage : quickMessage,
        );
      }
    },
    [mutations.DELETE_QUICK_MESSAGE](state, uuid) {
      state.quickMessages = state.quickMessages.filter(
        (quickMessage) => quickMessage.uuid !== uuid,
      );
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

    async create({ commit }, { title, text, shortcut }) {
      const newQuickMessage = { title, text, shortcut };
      await QuickMessage.create(newQuickMessage);

      commit(mutations.ADD_QUICK_MESSAGE, newQuickMessage);
    },

    async update({ commit }, { uuid, title, text, shortcut }) {
      const dataToUpdate = { title, text, shortcut };
      await QuickMessage.update(uuid, dataToUpdate);

      commit(mutations.UPDATE_QUICK_MESSAGE, { uuid, ...dataToUpdate });
    },

    async delete({ commit }, uuid) {
      await QuickMessage.delete(uuid);

      commit(mutations.DELETE_QUICK_MESSAGE, uuid);
    },
  },
};
