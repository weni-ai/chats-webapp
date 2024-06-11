import { defineStore } from 'pinia';
import Sector from '@/services/api/resources/settings/sector';
import cloneDeep from 'lodash.clonedeep';

export const useSettings = defineStore('settings', {
  state: () => ({ sectors: [], activeSectorId: null }),
  actions: {
    addSector(sector) {
      const lastId = this.sectors.at(-1).id;
      let queueId = 100;
      this.sectors.push({
        ...sector,
        id: lastId + 1,
        queues: sector.queues.map((q) => ({ ...q, id: queueId++ })),
      });
    },

    setActiveSectorId(id) {
      this.activeSectorId = id;
    },

    saveSector(sector) {
      this.addSector({ ...sector, contacts: { count: 0 } });
    },

    updateSector(sector) {
      if (!sector.id) this.saveSector(sector);
      const index = this.sectors.findIndex((s) => s.id === sector.id);
      this.sectors.splice(index, 1, sector);
    },
    async deleteSector(sectorUuid) {
      await Sector.deleteSector(sectorUuid);
      this.sectors = this.sectors.filter(
        (sector) => sector.uuid !== sectorUuid,
      );
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
});
