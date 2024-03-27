import cloneDeep from 'lodash.clonedeep';
import Sector from '@/services/api/resources/settings/sector';

const module = {
  namespaced: true,
  state: {
    sectors: [],
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
    deleteSector(state, sectorUuid) {
      state.sectors = state.sectors.filter((sector) => sector.uuid !== sectorUuid);
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
    async deleteSector({ commit }, sectorUuid) {
      await Sector.deleteSector(sectorUuid);

      commit('deleteSector', sectorUuid);
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