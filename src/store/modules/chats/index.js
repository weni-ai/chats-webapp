import quickMessagesModule from './quickMessages';

const tags = [
  { text: 'Dúvidas', value: 'doubts' },
  { text: 'Financeiro', value: 'finance' },
  { text: 'Ajuda', value: 'help' },
];
let chats = [
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
                // Get a random image with 1920x1080 pixels (16:9 proportion)
                src: 'https://picsum.photos/1920/1080',
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
        unreadMessages: 3,
        messages: [
          {
            id: '1',
            username: 'Milton Neves',
            time: '10h15',
            content: [
              { text: 'Olá' },
              {
                text: 'Gostaria de uma segunda via da minha fatura com prazo atualizado',
              },
            ],
          },
          {
            id: '2',
            username: 'Agente',
            time: '10h20',
            content: [
              { text: 'Olá, Milton' },
              {
                text: 'Segue o boleto atualizado!',
              },
              {
                // image with A4 proportion to simulate a PDF document
                src: 'https://picsum.photos/2480/3508',
                type: 'document',
                isMedia: true,
                fileExtension: 'pdf',
                filename: 'Boleto atualizado',
              },
            ],
          },
          {
            id: '3',
            username: 'Milton Neves',
            time: '10h22',
            content: [
              { text: 'Muito obrigado!' },
              {
                text: 'Me ajudou muito :)',
              },
              {
                text: 'Tenha um bom dia!',
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
    tags: [tags[1], tags[2]],
    rooms: [
      {
        id: '1',
        agent: 'Bot',
        transferredTo: 'fila Financeiro',
        messages: [
          {
            id: '1',
            username: 'Milton Neves',
            time: '10h15',
            content: [{ text: 'Olá estou precisando de ajuda' }],
          },
          {
            id: '2',
            username: 'Bot',
            time: '10h18',
            content: [{ text: 'Olá Milton, como posso te ajudar?' }],
          },
          {
            id: '3',
            username: 'Milton Neves',
            time: '10h20',
            content: [{ text: 'Preciso da segunda via de um boleto' }],
          },
          {
            id: '4',
            username: 'Bot',
            time: '10h20',
            content: [{ text: 'Vou precisar que você confirme seu CPF' }],
          },
          {
            id: '5',
            username: 'Bot',
            time: '10h20',
            content: [{ text: 'Vou precisar que você confirme seu CPF' }],
          },
          {
            id: '6',
            username: 'Milton Neves',
            time: '10h21',
            content: [{ text: '234.343.348-95' }],
          },
          {
            id: '7',
            username: 'Bot',
            time: '10h21',
            content: [
              { text: 'Milton, vou te passar para o atendimento humano, peço que aguarde' },
            ],
          },
        ],
      },
      {
        id: '2',
        agent: 'Fabricio Correia',
        closedBy: 'agent',
        transferredTo: 'fila Suporte',
        tags: [tags[1], tags[2]],
        messages: [
          {
            id: '1',
            username: 'Milton Neves',
            time: '10h15',
            content: [{ text: 'Olá estou precisando de ajuda' }],
          },
          {
            id: '2',
            username: 'Bot',
            time: '10h18',
            content: [{ text: 'Olá Milton, como posso te ajudar?' }],
          },
          {
            id: '3',
            username: 'Milton Neves',
            time: '10h20',
            content: [{ text: 'Preciso da segunda via de um boleto' }],
          },
          {
            id: '4',
            username: 'Bot',
            time: '10h20',
            content: [{ text: 'Vou precisar que você confirme seu CPF' }],
          },
          {
            id: '5',
            username: 'Bot',
            time: '10h20',
            content: [{ text: 'Vou precisar que você confirme seu CPF' }],
          },
          {
            id: '6',
            username: 'Milton Neves',
            time: '10h21',
            content: [{ text: '234.343.348-95' }],
          },
          {
            id: '7',
            username: 'Bot',
            time: '10h21',
            content: [
              { text: 'Milton, vou te passar para o atendimento humano, peço que aguarde' },
            ],
          },
        ],
      },
      {
        id: '3',
        agent: 'Amanda Santos',
        closedBy: 'agent',
        tags: [tags[1], tags[2]],
        messages: [
          {
            id: '1',
            username: 'Milton Neves',
            time: '10h15',
            content: [{ text: 'Olá estou precisando de ajuda' }],
          },
          {
            id: '2',
            username: 'Bot',
            time: '10h18',
            content: [{ text: 'Olá Milton, como posso te ajudar?' }],
          },
          {
            id: '3',
            username: 'Milton Neves',
            time: '10h20',
            content: [{ text: 'Preciso da segunda via de um boleto' }],
          },
          {
            id: '4',
            username: 'Bot',
            time: '10h20',
            content: [{ text: 'Vou precisar que você confirme seu CPF' }],
          },
          {
            id: '5',
            username: 'Bot',
            time: '10h20',
            content: [{ text: 'Vou precisar que você confirme seu CPF' }],
          },
          {
            id: '6',
            username: 'Milton Neves',
            time: '10h21',
            content: [{ text: '234.343.348-95' }],
          },
          {
            id: '7',
            username: 'Bot',
            time: '10h21',
            content: [
              { text: 'Milton, vou te passar para o atendimento humano, peço que aguarde' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: '2',
    username: 'João Claudio',
    date: '05/02/2022',
    tags: [tags[1]],
    agent: 'Felipe',
    closed: true,
    rooms: [
      {
        agent: 'Felipe',
        tags: [tags[1]],
        closedBy: 'agent',
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
    ],
  },
  {
    id: '3',
    username: 'Dulce Figueira',
    agent: 'Ana',
    date: '02/02/2022',
    closed: true,
    tags: [tags[0]],
    rooms: [
      {
        agent: 'Ana',
        closedBy: 'agent',
        tags: [tags[0]],
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
    ],
  },
];

const channels = ['WhatsApp', 'Telegram', 'Instagram'];

chats = chats.map((group) => ({
  ...group,
  chats: group.chats.map((chat) => {
    const lastView = Math.round(Math.random() * 9 + 1);
    const lastContactDate = `${new Date().getDate().toString().padStart(2, 0)}/05/2022`;
    const channel = channels[Math.round(Math.random() * (channels.length - 1))];

    return {
      ...chat,
      lastView,
      lastContactDate,
      channel,
    };
  }),
}));

const module = {
  namespaced: true,
  modules: {
    quickMessages: quickMessagesModule,
  },
  state: {
    activeChat: null,
    chats,
    tags,
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

      state.activeChat.messages = messages;
    },
  },

  getters: {
    getChatById(state) {
      const chats = state.chats.map((chatGroup) => chatGroup.chats).flat();

      return (id) => chats.find((chat) => chat.id === id.toString());
    },
  },

  actions: {
    closeChat({ commit }, chat) {
      commit('removeChat', chat);

      const formattedChat = {
        ...chat,
        rooms: [
          {
            agent: chat.agent,
            messages: chat.messages,
            tags: chat.tags,
            closedBy: 'agent',
          },
        ],
      };

      commit('addClosedChat', formattedChat);
    },
    sendMessage({ commit, state }, content) {
      if (!state.activeChat) return;

      const message =
        typeof content === 'string' ? { text: content, sent: Math.random() < 0.1 } : content;

      commit('sendMessage', message);
      commit('reorderChats', state.activeChat);
    },
  },
};

export default module;
