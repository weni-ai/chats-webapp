import Queues from '@/services/api/resources/chats/queues';
import { defineStore } from 'pinia';

export const useProfile = defineStore('profile', {
  state: () => ({
    me: {},
  }),
  actions: {
    setMe(user) {
      this.me = user || {};
    },
    async getMeQueues() {
      const { user_permissions } = await Queues.getListQueues();
      this.me.queues = user_permissions;
    },
  },
});
