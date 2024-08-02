import Queues from '@/services/api/resources/chats/queues';
import { defineStore } from 'pinia';

export const useProfile = defineStore('profile', {
  state: () => ({
    me: {},
  }),
  actions: {
    async setMe(user) {
      this.me = user || {};
      await this.getMeQueues();
    },
    async getMeQueues() {
      const { user_permissions } = await Queues.getListQueues();
      this.me.queues = user_permissions;
    },
  },
});
