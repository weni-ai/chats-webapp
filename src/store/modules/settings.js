import { defineStore } from 'pinia';
import Sector from '@/services/api/resources/settings/sector';
import Group from '@/services/api/resources/settings/group';

import cloneDeep from 'lodash.clonedeep';
import { removeDuplicatedItems } from '@/utils/array';

export const useSettings = defineStore('settings', {
  state: () => ({
    sectors: [],
    isLoadingSectors: false,
    nextSectors: '',
    previousSectors: '',
    currentSector: null,
    groups: [],
    isLoadingGroups: false,
    nextGroups: '',
    previousGroups: '',
    currentGroup: null,
  }),

  actions: {
    async getSectors(getAll = false) {
      const isInLastPage = !this.nextSectors && this.previousSectors;

      if (isInLastPage) return;

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
        if (getAll && this.nextSectors) this.getSectors(true);
        else this.isLoadingSectors = false;
      }
    },

    async getGroups(getAll = false) {
      const isInLastPage = !this.nextGroups && this.previousGroups;

      if (isInLastPage) return;

      try {
        this.isLoadingGroups = true;
        const { results, next, previous } = await Group.list({
          nextReq: this.nextGroups,
        });

        this.groups = removeDuplicatedItems([...this.groups, ...results]);

        this.nextGroups = next;
        this.previousGroups = previous;
      } catch (error) {
        console.error(error);
      } finally {
        if (getAll && this.nextGroups) this.getGroups(true);
        else this.isLoadingGroups = false;
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
