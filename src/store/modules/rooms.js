import Message from '@/services/api/resources/message';
import Room from '@/services/api/resources/room';

const mutations = {
  SET_ROOMS: 'SET_ROOMS',
  SET_ACTIVE_ROOM: 'SET_ACTIVE_ROOM',
  SET_ACTIVE_ROOM_MESSAGES: 'SET_ACTIVE_ROOM_MESSAGES',
};

const utils = {
  groupSequentialSentMessages(messages) {
    const messagesWithSender = messages.map((message) =>
      message.contact || message.user
        ? {
            ...message,
            sender: message.contact || message.user,
          }
        : message,
    );

    const groupedMessages = messagesWithSender.reduce((acc, message) => {
      if (!message.sender) {
        acc.push(message);
        return acc;
      }

      if (acc.at(-1)?.sender?.id !== message.sender.id) {
        const m = { ...message, content: [{ uuid: message.uuid, text: message.text }] };
        acc.push(m);
        return acc;
      }

      acc[acc.length - 1].content.push({ uuid: message.uuid, text: message.text });
      return acc;
    }, []);

    return groupedMessages;
  },
};

export default {
  namespaced: true,
  state: {
    rooms: [],
    activeRoom: null,
    activeRoomMessages: [],
  },

  mutations: {
    [mutations.SET_ROOMS](state, rooms) {
      state.rooms = rooms;
    },
    [mutations.SET_ACTIVE_ROOM](state, room) {
      state.activeRoom = room;
    },
    [mutations.SET_ACTIVE_ROOM_MESSAGES](state, messages) {
      state.activeRoomMessages = messages;
    },
  },

  actions: {
    async getAll({ commit }) {
      const response = await Room.getAll();
      const rooms = response.results || [];
      commit(mutations.SET_ROOMS, rooms);
      return rooms;
    },
    setActiveRoom({ commit }, room) {
      commit(mutations.SET_ACTIVE_ROOM, room);
    },
    async getActiveRoomMessages({ commit, state }) {
      const { activeRoom } = state;
      if (!activeRoom) return;
      const response = await Message.getByRoomId(activeRoom.uuid);
      const messages = utils.groupSequentialSentMessages(response.results || []);
      commit(mutations.SET_ACTIVE_ROOM_MESSAGES, messages);
    },
    async sendMessage(ctx, text) {
      console.log({ message: text });
    },
  },

  getters: {
    agentRooms(state) {
      return state.rooms.filter((room) => !!room.user);
    },
    waitingQueue(state) {
      return state.rooms.filter((room) => !room.user);
    },
    getRoomById: (state) => (uuid) => {
      return state.rooms.find((room) => room.uuid === uuid);
    },
  },
};
