const mutations = {
  SET_VIEWED_AGENT: 'SET_VIEWED_AGENT',
};

export default {
  namespaced: true,
  state: {
    viewedAgent: '',
  },

  mutations: {
    [mutations.SET_VIEWED_AGENT](state, viewedAgent = '') {
      state.viewedAgent = viewedAgent;
    },
  },

  getters: {
    getViewedAgent({ viewedAgent }) {
      return viewedAgent;
    },
  },

  actions: {
    setViewedAgent({ commit }, viewedAgent) {
      commit(mutations.SET_VIEWED_AGENT, viewedAgent);
    },
  },
};
