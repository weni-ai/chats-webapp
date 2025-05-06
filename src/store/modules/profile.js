import Queues from '@/services/api/resources/chats/queues';
import { defineStore } from 'pinia';

export const useProfile = defineStore('profile', {
  state: () => ({
    me: {},
  }),
  actions: {
    setMe(user) {
      this.me = { ...(user || {}), queues: this.me.queues };
    },
    async getMeQueues() {
      const { user_permissions } = await Queues.getListQueues();
      this.me.queues = user_permissions;
    },
  },
  getters: {
    isHumanServiceProfile: (state) => state.me?.project_permission_role === 2,
  },
});
