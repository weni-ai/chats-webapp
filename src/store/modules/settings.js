import cloneDeep from 'lodash.clonedeep';

const sectors = [
  {
    id: 1,
    name: 'Suporte',
    manager: 'Maria da Silva',
    queues: [
      {
        id: 1,
        name: 'Fila 1',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 2,
        name: 'Fila 2',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 3,
        name: 'Fila 3',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 4,
        name: 'Fila 4',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
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
        id: 1,
        name: 'Cartão de crédito',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 2,
        name: 'Fila 1',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 3,
        name: 'Fila 2',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
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
    queues: [
      {
        id: 1,
        name: 'Fila 1',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 2,
        name: 'Fila 2',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 3,
        name: 'Fila 3',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 4,
        name: 'Fila 4',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
        createdAt: '25/03/2022',
      },
      {
        id: 5,
        name: 'Fila 5',
        agents: [
          {
            name: 'Fabricio Correia',
            additionDate: '25/03/2022',
          },
          {
            name: 'Daniela Maciel',
            additionDate: '25/03/2022',
          },
        ],
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
      let queueId = 100;
      state.sectors.push({
        ...sector,
        id: lastId + 1,
        // eslint-disable-next-line no-plusplus
        queues: sector.queues.map((q) => ({ ...q, id: queueId++ })),
      });
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
