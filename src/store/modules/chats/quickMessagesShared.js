import { defineStore } from 'pinia';

import QuickMessage from '@/services/api/resources/chats/quickMessage';

export const useQuickMessageShared = defineStore('quickMessagesShared', {
  state: () => ({
    quickMessagesShared: [],
    nextQuickMessagesShared: '',
    quickMessagesSharedBySector: {},
    requestedSectors: [],
    quickMessagesSharedByProject: [],
    nextQuickMessagesSharedByProject: '',
    quickMessagesSharedByProjectRequested: false,
    isLoadingQuickMessagesSharedByProject: false,
  }),
  getters: {
    sharedBySector: (state) => (sectorUuid) =>
      state.quickMessagesSharedBySector[sectorUuid] || [],
    hasMoreQuickMessagesSharedByProject: (state) =>
      !!state.nextQuickMessagesSharedByProject,
  },
  actions: {
    updateQuickMessageShared({ uuid, title, text, shortcut }) {
      const quickMessageToUpdate = this.quickMessagesShared.find(
        (quickMessage) => quickMessage.uuid === uuid,
      );

      if (quickMessageToUpdate) {
        const updatedQuickMessageShared = {
          ...quickMessageToUpdate,
          title,
          text,
          shortcut,
        };

        this.quickMessagesShared = this.quickMessagesShared.map(
          (quickMessage) =>
            quickMessage.uuid === uuid
              ? updatedQuickMessageShared
              : quickMessage,
        );
      }
    },
    async getAll() {
      const { quickMessagesShared, nextQuickMessagesShared } = this;

      const response = await QuickMessage.getAllBySector({
        nextQuickMessagesShared,
      });
      const responseNext = response.next;
      const newQuickMessagesShared =
        [...quickMessagesShared, ...response.results] || [];

      this.nextQuickMessagesShared = responseNext;
      this.quickMessagesShared = newQuickMessagesShared;

      return newQuickMessagesShared;
    },

    async loadBySectorIfNeeded(sectorUuid) {
      if (!sectorUuid || this.requestedSectors.includes(sectorUuid)) return;
      this.requestedSectors = [...this.requestedSectors, sectorUuid];

      try {
        let next = '';
        let messages = [];

        do {
          const response = await QuickMessage.getBySectorV2({
            sectorUuid,
            next,
          });
          messages = [...messages, ...(response.results || [])];
          next = response.next;
        } while (next);

        this.quickMessagesSharedBySector = {
          ...this.quickMessagesSharedBySector,
          [sectorUuid]: messages,
        };
      } catch (error) {
        this.requestedSectors = this.requestedSectors.filter(
          (sector) => sector !== sectorUuid,
        );
        throw error;
      }
    },

    async getByProjectNextPage() {
      if (
        this.quickMessagesSharedByProjectRequested &&
        !this.nextQuickMessagesSharedByProject
      ) {
        return;
      }

      if (this.isLoadingQuickMessagesSharedByProject) return;
      this.isLoadingQuickMessagesSharedByProject = true;

      try {
        const response = await QuickMessage.getByProjectV2({
          next: this.nextQuickMessagesSharedByProject,
        });

        this.quickMessagesSharedByProject = [
          ...this.quickMessagesSharedByProject,
          ...(response.results || []),
        ];
        this.nextQuickMessagesSharedByProject = response.next;
        this.quickMessagesSharedByProjectRequested = true;
      } finally {
        this.isLoadingQuickMessagesSharedByProject = false;
      }
    },

    async create({ sectorUuid, title, text, shortcut }) {
      const newQuickMessageShared = { sectorUuid, title, text, shortcut };
      const message = await QuickMessage.createBySector(newQuickMessageShared);
      this.quickMessagesShared.unshift(message);
    },

    async update({ quickMessageUuid, title, text, shortcut }) {
      const dataToUpdate = { title, text, shortcut };
      await QuickMessage.updateBySector(quickMessageUuid, dataToUpdate);

      this.updateQuickMessageShared({
        uuid: quickMessageUuid,
        ...dataToUpdate,
      });
    },

    async delete(quickMessageUuid) {
      await QuickMessage.deleteBySector(quickMessageUuid);
      this.quickMessagesShared = this.quickMessagesShared.filter(
        (quickMessage) => quickMessage.uuid !== quickMessageUuid,
      );
    },
  },
});
