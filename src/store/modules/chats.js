const chats = [
  {
    name: 'Fila',
    chats: [
      {
        id: '1',
        username: 'João Cláudio',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 8,
        waitingTime: 5,
        messages: [],
      },
      {
        id: '2',
        username: 'Marcela Barros',
        lastMessage: 'Acho que podemos conversar ama...',
        waitingTime: 3,
        unreadMessages: 5,
        messages: [],
      },
      {
        id: '3',
        username: 'Roberto Barcelos',
        lastMessage: 'Acho que podemos conversar ama...',
        waitingTime: 2,
        unreadMessages: 10,
        messages: [],
      },
    ],
  },
  {
    name: 'Chats Abertos',
    chats: [
      {
        id: '4',
        username: 'Pedro Pontes',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 8,
        messages: [
          {
            id: '1',
            username: 'Pedro Pontes',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Pedro' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
          {
            id: '3',
            username: 'Pedro Pontes',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '4',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Pedro' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
          {
            id: '5',
            username: 'Pedro Pontes',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '6',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Pedro' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
        ],
      },
      {
        id: '5',
        username: 'Ilanna Lins',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 5,
        messages: [
          {
            id: '1',
            username: 'Ilanna Lins',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber como faço para alterar as configurações do meu perfil',
              },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Ilanna' },
              {
                text: 'Vou te mostrar como fazer, é só acessar seu perfil e seguir os passos contidos na imagem',
              },
              {
                // Get a random image with 224x126 pixels (16:9 proportion)
                src: 'https://picsum.photos/224/126',
                type: 'image',
                isMedia: true,
                fileExtension: 'png',
                filename: 'Captura de tela',
              },
            ],
          },
          {
            id: '3',
            username: 'Ilanna Lins',
            time: '10h15',
            content: [
              { text: 'Muito obrigada!' },
              {
                text: 'Me ajudou muito :)',
              },
            ],
          },
        ],
      },
      {
        id: '6',
        username: 'Rafael Felipe',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 10,
        messages: [
          {
            id: '1',
            username: 'Rafael Felipe',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber como faço para alterar as configurações do meu perfil',
              },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Rafael' },
              {
                text: 'Vou te mostrar como fazer, é só acessar seu perfil e seguir os passos contidos que o vídeo mostra:',
              },
              {
                // example video
                src: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
                type: 'video',
                isMedia: true,
                fileExtension: 'mp4',
                filename: 'Tutorial de cadastro',
              },
            ],
          },
          {
            id: '3',
            username: 'Rafael Felipe',
            time: '10h15',
            content: [
              { text: 'Muito obrigada!' },
              {
                text: 'Me ajudou muito :)',
              },
            ],
          },
        ],
      },
      {
        id: '7',
        username: 'Milton Neves',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 8,
        messages: [
          {
            id: '1',
            username: 'Milton Neves',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Milton' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
        ],
      },
      {
        id: '8',
        username: 'Thiago Paiva',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 5,
        messages: [
          {
            id: '1',
            username: 'Thiago Paiva',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Thiago' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
        ],
      },
      {
        id: '9',
        username: 'Agnaldo França',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 10,
        messages: [
          {
            id: '1',
            username: 'Agnaldo França',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Agnaldo' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
        ],
      },
      {
        id: '10',
        username: 'Tânia Almeida',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 8,
        messages: [
          {
            id: '1',
            username: 'Tânia Almeida',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Tânia' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
        ],
      },
      {
        id: '11',
        username: 'Thiago Paiva',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 5,
        messages: [
          {
            id: '1',
            username: 'Thiago Paiva',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Thiago' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
        ],
      },
      {
        id: '12',
        username: 'Cíntia Silva',
        lastMessage: 'Acho que podemos conversar ama...',
        unreadMessages: 10,
        messages: [
          {
            id: '1',
            username: 'Cíntia Silva',
            time: '10h15',
            content: [
              { text: 'Oi' },
              {
                text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
              },
              { text: 'O boleto venceu ontem e eu não queria pagar juros' },
              { text: 'Como faço?' },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Cíntia' },
              {
                text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
              },
            ],
          },
        ],
      },
    ],
  },
];

const closedChats = [
  {
    id: '1',
    username: 'Milton Neves',
    agent: 'Debora',
    date: '25/03/2022',
    closed: true,
    tags: ['finance', 'help'],
    messages: [
      {
        id: '1',
        username: 'Milton Neves',
        time: '10h15',
        content: [
          { text: 'Oi' },
          {
            text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
          },
          { text: 'O boleto venceu ontem e eu não queria pagar juros' },
          { text: 'Como faço?' },
        ],
      },
      {
        id: '2',
        username: 'Agente',
        time: '10h20',
        content: [
          { text: 'Olá, Milton' },
          {
            text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    username: 'João Claudio',
    agent: 'Felipe',
    date: '05/02/2022',
    closed: true,
    tags: ['finance'],
    messages: [
      {
        id: '1',
        username: 'João Claudio',
        time: '10h15',
        content: [
          { text: 'Oi' },
          {
            text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
          },
          { text: 'O boleto venceu ontem e eu não queria pagar juros' },
          { text: 'Como faço?' },
        ],
      },
      {
        id: '2',
        username: 'Agente',
        time: '10h20',
        content: [
          { text: 'Olá, João' },
          {
            text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    username: 'Dulce Figueira',
    agent: 'Ana',
    date: '02/02/2022',
    closed: true,
    tags: ['doubts'],
    messages: [
      {
        id: '1',
        username: 'Dulce Figueira',
        time: '10h15',
        content: [
          { text: 'Oi' },
          {
            text: 'Gostaria de saber se consigo pagar meu boleto depois do vencimento',
          },
          { text: 'O boleto venceu ontem e eu não queria pagar juros' },
          { text: 'Como faço?' },
        ],
      },
      {
        id: '2',
        username: 'Agente',
        time: '10h20',
        content: [
          { text: 'Olá, Dulce' },
          {
            text: 'Preciso confirmar com o financeiro, você me dá um minuto?',
          },
        ],
      },
    ],
  },
];

const module = {
  namespaced: true,
  state: {
    activeChat: null,
    chats,
    closedChats,
  },

  mutations: {
    addClosedChat(state, chat) {
      state.closedChats.unshift(chat);
    },
    removeChat(state, chatToRemove) {
      state.chats = state.chats.map((group) => ({
        ...group,
        chats: group.chats.filter((c) => c.id !== chatToRemove.id),
      }));
    },
    reorderChats(state, activeChat) {
      const activeChatGroup = state.chats.find(
        (group) => !!group.chats.find((chat) => chat.id === activeChat.id),
      );

      activeChatGroup.chats = activeChatGroup.chats.filter((chat) => chat.id !== activeChat.id);
      activeChatGroup.chats.unshift(activeChat);
    },
    setActiveChat(state, chat) {
      state.activeChat = chat ? { ...chat, unreadMessages: 0 } : null;

      if (!chat) return;

      state.chats = state.chats.map((group) => ({
        ...group,
        chats: group.chats.map((c) => (c.id === chat.id ? { ...c, unreadMessages: 0 } : c)),
      }));
    },
    sendMessage(state, message) {
      if (!state.activeChat) return;

      const { messages } = state.activeChat;

      if (messages.at(-1)?.username === 'Agente') {
        messages.at(-1).content.push(message);
      } else {
        messages.push({
          id: Math.ceil(Math.random() * 100 + 1),
          username: 'Agente',
          time: `${new Date().getHours().toString().padStart(2, '0')}h${new Date()
            .getMinutes()
            .toString()
            .padStart(2, '0')}`,
          content: [message],
        });
      }
    },
  },

  actions: {
    closeChat({ commit }, chat) {
      commit('removeChat', chat);
      commit('addClosedChat', chat);
    },
    sendMessage({ commit, state }, text) {
      if (!state.activeChat) return;

      const message = { text, sent: Math.random() < 0.1 };

      commit('sendMessage', message);
      commit('reorderChats', state.activeChat);
    },
  },
};

export default module;
