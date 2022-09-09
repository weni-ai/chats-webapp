const mutations = {
  SET_TOKEN: 'SET_TOKEN',
  SET_PROJECT: 'SET_PROJECT',
};

export default {
  namespaced: true,
  state: {
    token: '',
    project: '',
  },
  mutations: {
    [mutations.SET_TOKEN](state, token) {
      state.token = token;
    },
    [mutations.SET_PROJECT](state, project) {
      state.project = project;
    },
  },
  actions: {
    setToken({ commit }, token) {
      commit(mutations.SET_TOKEN, token);
    },
    setProject({ commit }, project) {
      commit(mutations.SET_PROJECT, project);
    },
  },
};
