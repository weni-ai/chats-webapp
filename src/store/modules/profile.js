import { defineStore } from 'pinia';

export const useProfile = defineStore('profile', {
  state: () => ({
    me: {},
  }),
  actions: {
    setMe(user) {
      this.me = user || {};
    },
  },
});
