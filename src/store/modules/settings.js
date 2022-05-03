const sectors = [
  {
    id: 1,
    name: 'Suporte',
    queues: [{}, {}, {}, {}, {}],
    agents: [{}, {}, {}, {}, {}, {}],
    contacts: {
      count: 427,
    },
  },
  {
    id: 2,
    name: 'Financeiro',
    queues: [{}, {}],
    agents: [{}, {}, {}],
    contacts: {
      count: 312,
    },
  },
  {
    id: 3,
    name: 'Suporte',
    queues: [{}, {}, {}, {}, {}],
    agents: [{}, {}, {}, {}, {}, {}],
    contacts: {
      count: 427,
    },
  },
];

const module = {
  namespaced: true,
  state: {
    sectors,
    activeSectorId: null,
  },

  mutations: {
    addSector(state, sector) {
      const lastId = state.sectors.at(-1).id;
      state.sectors.push({ ...sector, id: lastId + 1 });
    },
    setActiveSectorId(state, id) {
      state.activeSectorId = id;
    },
  },

  actions: {
    saveSector({ commit }, sector) {
      commit('addSector', { ...sector, contacts: { count: 0 } });
    },
  },

  getters: {
    getActiveSector({ sectors, activeSectorId }) {
      return sectors.find((sector) => sector.id === activeSectorId) || null;
    },
  },
};

export default module;
