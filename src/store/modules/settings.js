import cloneDeep from 'lodash.clonedeep';

const sectors = [
  {
    id: 1,
    name: 'Suporte',
    manager: 'Maria da Silva',
    queues: [
      {
        name: 'Fila 1',
        createdAt: '25/03/2022',
      },
      {
        name: 'Fila 2',
        createdAt: '25/03/2022',
      },
      {
        name: 'Fila 3',
        createdAt: '25/03/2022',
      },
      {
        name: 'Fila 4',
        createdAt: '25/03/2022',
      },
    ],
    agents: [{}, {}, {}, {}, {}, {}],
    contacts: {
      count: 427,
    },
    workingDay: {
      start: '08:00',
      end: '18:00',
    },
    maxSimultaneousChatsByAgent: '4',
  },
  {
    id: 2,
    name: 'Financeiro',
    manager: 'Carlos de Abreu',
    queues: [
      {
        name: 'Cartão de crédito',
        createdAt: '25/03/2022',
      },
      {
        name: 'Fila 1',
        createdAt: '25/03/2022',
      },
      {
        name: 'Fila 2',
        createdAt: '25/03/2022',
      },
    ],
    agents: [{}, {}, {}],
    contacts: {
      count: 312,
    },
    workingDay: {
      start: '08:00',
      end: '18:00',
    },
    maxSimultaneousChatsByAgent: '5',
  },
  {
    id: 3,
    name: 'Suporte',
    manager: 'Mario Souto',
    queues: [{}, {}, {}, {}, {}],
    agents: [{}, {}, {}, {}, {}, {}],
    contacts: {
      count: 427,
    },
    workingDay: {
      start: '08:00',
      end: '18:00',
    },
    maxSimultaneousChatsByAgent: '3',
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
    updateSector(state, sector) {
      const index = state.sectors.findIndex((s) => s.id === sector.id);
      state.sectors.splice(index, 1, sector);
    },
  },

  actions: {
    saveSector({ commit }, sector) {
      commit('addSector', { ...sector, contacts: { count: 0 } });
    },
    updateSector({ commit, dispatch }, sector) {
      if (!sector.id) dispatch('saveSector', sector);

      commit('updateSector', sector);
    },
  },

  getters: {
    getActiveSector({ sectors, activeSectorId }) {
      return sectors.find((sector) => sector.id === activeSectorId) || null;
    },
    getSectorById({ sectors }) {
      return (id) => {
        const sector = sectors.find((sector) => sector.id === id);
        return sector ? cloneDeep(sector) : null;
      };
    },
  },
};

export default module;
