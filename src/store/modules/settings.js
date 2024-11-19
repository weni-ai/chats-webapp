import { defineStore } from 'pinia';
import Sector from '@/services/api/resources/settings/sector';
import cloneDeep from 'lodash.clonedeep';
import { removeDuplicatedItems } from '@/utils/array';

export const useSettings = defineStore('settings', {
  state: () => ({
    sectors: [],
    isLoadingSectors: false,
    nextSectors: '',
    previousSectors: '',
    currentSector: null,
  }),

  actions: {
    async getSectors() {
      const isInLastPage = !this.nextSectors && this.previousSectors;
      if (this.isLoadingSectors || isInLastPage) {
        return;
      }

      try {
        this.isLoadingSectors = true;
        const { results, next, previous } = await Sector.list({
          nextReq: this.nextSectors,
        });
        this.sectors = removeDuplicatedItems([...this.sectors, ...results]);
        this.nextSectors = next;
        this.previousSectors = previous;
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoadingSectors = false;
      }
    },

    addSector(sector) {
      const lastId = this.sectors.at(-1).id;
      let queueId = 100;
      this.sectors.push({
        ...sector,
        id: lastId + 1,
        queues: sector.queues.map((q) => ({ ...q, id: queueId++ })),
      });
    },

    async getCurrentSector(uuid) {
      this.currentSector = await Sector.find(uuid);
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
    getSectorById({ sectors }) {
      return (id) => {
        const sector = sectors.find((sector) => sector.id === id);
        return sector ? cloneDeep(sector) : null;
      };
    },
  },
});
