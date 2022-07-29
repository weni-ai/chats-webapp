import Room from '@/services/api/resources/room';

const mutations = {
  SET_ROOMS: 'SET_ROOMS',
  SET_ACTIVE_ROOM: 'SET_ACTIVE_ROOM',
};

export default {
  namespaced: true,
  state: {
    rooms: [],
    activeRoom: null,
  },

  mutations: {
    [mutations.SET_ROOMS](state, rooms) {
      state.rooms = rooms;
    },
    [mutations.SET_ACTIVE_ROOM](state, room) {
      state.activeRoom = room;
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
