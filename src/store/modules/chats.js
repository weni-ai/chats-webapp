const chats = {
  namespaced: true,
  state: {
    activeChat: null,
  },

  mutations: {
    setActiveChat(state, chat) {
      state.activeChat = chat;
    },
  },
};

export default chats;
