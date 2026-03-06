import { defineStore } from 'pinia';

import QuickMessage from '@/services/api/resources/chats/quickMessage';

export interface QuickMessageItem {
  uuid: string;
  title: string;
  text: string;
  shortcut: string | null;
}

export const useQuickMessages = defineStore('quickMessages', {
  state: () => ({
    quickMessages: [] as QuickMessageItem[],
    nextQuickMessages: '',
  }),
  actions: {
    updateQuickMessage({ uuid, title, text, shortcut }: QuickMessageItem) {
      const quickMessageToUpdate = this.quickMessages.find(
        (quickMessage) => quickMessage.uuid === uuid,
      );

      if (quickMessageToUpdate) {
        const updatedQuickMessage = {
          ...quickMessageToUpdate,
          title,
          text,
          shortcut,
        };

        this.quickMessages = this.quickMessages.map((quickMessage) =>
          quickMessage.uuid === uuid ? updatedQuickMessage : quickMessage,
        );
      }
    },
    async getAll(): Promise<QuickMessageItem[]> {
      const { quickMessages, nextQuickMessages } = this;

      const response = await QuickMessage.getAll({ nextQuickMessages });

      const newQuickMessages = [...quickMessages, ...(response?.results || [])];

      this.nextQuickMessages = response?.next;
      this.quickMessages = newQuickMessages;

      return newQuickMessages;
    },

    async create({ title, text, shortcut }: Omit<QuickMessageItem, 'uuid'>) {
      const newQuickMessage = { title, text, shortcut };
      const response = await QuickMessage.create(newQuickMessage);
      this.quickMessages.unshift(response);
    },

    async update({ uuid, title, text, shortcut }: QuickMessageItem) {
      const dataToUpdate = { title, text, shortcut };
      await QuickMessage.update(uuid, dataToUpdate);
      this.updateQuickMessage({ uuid, ...dataToUpdate });
    },

    async delete(uuid: string) {
      await QuickMessage.delete(uuid);

      this.quickMessages = this.quickMessages.filter(
        (quickMessage) => quickMessage.uuid !== uuid,
      );
    },
  },
});
