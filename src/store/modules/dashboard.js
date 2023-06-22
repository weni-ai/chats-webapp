const mutations = {
  SET_VIEWED_AGENT: 'SET_VIEWED_AGENT',
  SET_SHOW_MODAL_ASSUMED_CHAT: 'SET_SHOW_MODAL_ASSUMED_CHAT',
  SET_ASSUMED_CHAT_CONTACT_NAME: 'SET_ASSUMED_CHAT_CONTACT_NAME',
};

export default {
  namespaced: true,
  state: {
    viewedAgent: '',
    showModalAssumedChat: false,
    assumedChatContactName: '',
  },

  mutations: {
    [mutations.SET_VIEWED_AGENT](state, viewedAgent = '') {
      state.viewedAgent = viewedAgent;
    },
    [mutations.SET_SHOW_MODAL_ASSUMED_CHAT](state, isAssumedChat = false) {
      state.showModalAssumedChat = isAssumedChat;
    },
    [mutations.SET_ASSUMED_CHAT_CONTACT_NAME](state, contactName = '') {
      state.assumedChatContactName = contactName;
    },
  },

  getters: {
    getViewedAgent({ viewedAgent }) {
      return viewedAgent;
    },
    getShowModalAssumedChat({ showModalAssumedChat }) {
      return showModalAssumedChat;
    },
    getAssumedChatContactName({ assumedChatContactName }) {
      return assumedChatContactName;
    },
  },

  actions: {
    setViewedAgent({ commit }, viewedAgent) {
      commit(mutations.SET_VIEWED_AGENT, viewedAgent);
    },
    setShowModalAssumedChat({ commit }, isAssumedChat) {
      commit(mutations.SET_SHOW_MODAL_ASSUMED_CHAT, isAssumedChat);
    },
  },
};
