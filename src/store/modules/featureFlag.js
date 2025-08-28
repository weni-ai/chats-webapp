import { defineStore } from 'pinia';
import FeatureFlag from '@/services/api/resources/featureFlag/featureFlag';

export const useFeatureFlag = defineStore('featureFlag', {
  state: () => ({
    featureFlags: {},
    isLoadingFeatureFlags: false,
  }),

  actions: {
    async getFeatureFlags() {
      try {
        this.isLoadingFeatureFlags = true;
        const response = await FeatureFlag.getAllFeatureFlags();
        this.featureFlags = response;
      } catch (error) {
        console.error('Error getting feature flags', error);
      } finally {
        this.isLoadingFeatureFlags = false;
      }
    },
  },
});
