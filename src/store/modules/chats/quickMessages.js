const module = {
  namespaced: true,
  state: {
    messages: [
      {
        id: 1,
        title: 'Boas-vindas',
        message: 'Olá, seja bem vindo (a)! Em que posso te ajudar?',
      },
      {
        id: 2,
        title: 'Transferência',
        message: 'Agradeço sua paciência, te transferirei para outro departamento.',
      },
    ],
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
