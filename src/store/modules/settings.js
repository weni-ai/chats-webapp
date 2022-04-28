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
  },

  mutations: {},

  actions: {},
};

export default module;
