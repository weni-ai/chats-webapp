const module = {
  namespaced: true,
  state: {
    messages: [],
    sharedMessages: [],
  },
  mutations: {
    addMessage(state, message) {
      const messagesIds = state.messages.map((m) => m.id);
      const highestMessageId = Math.max(...messagesIds);
      state.messages.push({
        ...message,
        id: highestMessageId + 1,
      });
    },
    updateMessage(state, message) {
      state.messages = state.messages.map((m) => (m.id === message.id ? { ...message } : m));
    },
    deleteMessage(state, message) {
      state.messages = state.messages.filter((m) => m.id !== message.id);
    },
  },
};

export default module;
