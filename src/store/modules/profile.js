export default {
  namespaced: true,
  state: {
    me: {},
  },

  mutations: {
    setMe(state, user) {
      state.me = user || {};
    },
  },
};
