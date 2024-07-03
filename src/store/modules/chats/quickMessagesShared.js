import { defineStore } from 'pinia';

import QuickMessage from '@/services/api/resources/chats/quickMessage';

export const useQuickMessageShared = defineStore('quickMessagesShared', {
  state: () => ({ quickMessagesShared: [], nextQuickMessagesShared: '' }),
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
