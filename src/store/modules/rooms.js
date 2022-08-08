import Message from '@/services/api/resources/message';
import Room from '@/services/api/resources/room';
import { groupSequentialSentMessages } from '@/utils/messages';

const mutations = {
  SET_ROOMS: 'SET_ROOMS',
  SET_ACTIVE_ROOM: 'SET_ACTIVE_ROOM',
  SET_ACTIVE_ROOM_MESSAGES: 'SET_ACTIVE_ROOM_MESSAGES',
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
      const messages = groupSequentialSentMessages(response.results || []);
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
