import Queues from '@/services/api/resources/chats/queues';
import { defineStore } from 'pinia';

import type { QueuePermission } from '@/services/api/resources/chats/types';

export interface UserQueuePermission extends QueuePermission {
  queue: string;
  queue_name: string;
}

export interface User {
  id: number | string;
  email: string;
  project_permission_role: number;
  queues: UserQueuePermission[];
  [key: string]: any;
}

export const useProfile = defineStore('profile', {
  state: () => ({
    me: {} as Partial<User>,
  }),
  actions: {
    setMe(user: Partial<User>) {
      this.me = { ...(user || {}), queues: this.me.queues };
    },
    async getMeQueues() {
      const { user_permissions } = await Queues.getListQueues();
      this.me.queues = user_permissions as UserQueuePermission[];
    },
  },
  getters: {
    isHumanServiceProfile: (state) => state.me?.project_permission_role === 2,
  },
});
