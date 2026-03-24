import { defineStore } from 'pinia';

export const useRoomCounters = defineStore('roomCounters', {
  state: () => ({
    counts: { waiting: 0, ongoing: 0, flow_start: 0 },
    _headroom: { waiting: 0, ongoing: 0, flow_start: 0 },
  }),

  actions: {
    syncFromApi(type, apiCount, localSize) {
      if (!type || !(type in this.counts)) return;
      this.counts[type] = apiCount;
      this._headroom[type] = Math.max(0, apiCount - localSize);
    },

    handleCreate(type) {
      if (!type || !(type in this.counts)) return;
      this.counts[type]++;
    },

    handleClose(type) {
      if (!type || !(type in this.counts)) return;
      this.counts[type] = Math.max(0, this.counts[type] - 1);
    },

    handleRoomUpdate({ wasInArray, isNowInArray, oldType, newType }) {
      if (wasInArray && isNowInArray) {
        if (oldType && newType && oldType !== newType) {
          this.counts[oldType] = Math.max(0, this.counts[oldType] - 1);
          this.counts[newType]++;
        }
      } else if (wasInArray && !isNowInArray && oldType) {
        this.counts[oldType] = Math.max(0, this.counts[oldType] - 1);
      } else if (!wasInArray && isNowInArray && newType) {
        if (this._headroom[newType] > 0) {
          this._headroom[newType]--;
        } else {
          this.counts[newType]++;
        }
      }
    },
  },
});
