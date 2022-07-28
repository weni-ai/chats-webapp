import Room from '@/services/api/resources/room';

const mutations = {
  SET_ROOMS: 'SET_ROOMS',
};

export default {
  namespaced: true,
  state: {
    rooms: [],
  },

  mutations: {
    [mutations.SET_ROOMS](state, rooms) {
      state.rooms = rooms;
    },
  },

  actions: {
    async getAll({ commit }) {
      const response = await Room.getAll();
      const rooms = response.results || [];

      commit(mutations.SET_ROOMS, rooms);

      return rooms;
    },
  },

  getters: {
    agentRooms(state) {
      return state.rooms.filter((room) => !!room.user);
    },
    waitingQueue(state) {
      return state.rooms.filter((room) => !room.user);
    },
  },
};
