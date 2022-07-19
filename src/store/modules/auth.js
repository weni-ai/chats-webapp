const mutations = {
  SET_TOKEN: 'SET_TOKEN',
};

const auth = {
  namespaced: true,
  state: {
    token: '',
  },
  mutations: {
    [mutations.SET_TOKEN](state, token) {
      state.token = token;
    },
  },
  actions: {
    setToken({ commit }, token) {
      commit(mutations.SET_TOKEN, token);
    },
  },
};

export default auth;
