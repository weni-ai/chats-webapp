import { defineStore } from 'pinia';

export const useRoomCounters = defineStore('roomCounters', {
  state: () => ({
    counts: { waiting: 0, ongoing: 0, flow_start: 0 },
    _headroom: { waiting: 0, ongoing: 0, flow_start: 0 },
    _typeCache: {},
  }),

  actions: {
    syncFromApi(type, apiCount, localSize) {
      if (!type || !(type in this.counts)) return;
      this.counts[type] = apiCount;
      this._headroom[type] = Math.max(0, apiCount - localSize);
    },

    cacheRoomTypes(rooms, getRoomTypeFn) {
      for (const room of rooms) {
        if (room.uuid) this._typeCache[room.uuid] = getRoomTypeFn(room);
      }
    },

    handleCreate(type) {
      if (!type || !(type in this.counts)) return;
      this.counts[type]++;
    },

    handleClose(type) {
      if (!type || !(type in this.counts)) return;
      this.counts[type] = Math.max(0, this.counts[type] - 1);
    },

    _incrementType(type) {
      this.counts[type]++;
    },

    _decrementType(type) {
      this.counts[type] = Math.max(0, this.counts[type] - 1);
    },

    _decrementHeadroom(type) {
      if (this._headroom[type] > 0) {
        this._headroom[type]--;
        this._decrementType(type);
        return true;
      }
      return false;
    },

    _handleBothInArray(typeChanged, resolvedOldType, newType) {
      if (typeChanged) {
        this._decrementType(resolvedOldType);
        this._incrementType(newType);
      }
    },

    _handleEnteredArray(typeChanged, resolvedOldType, newType) {
      if (typeChanged) {
        this._incrementType(newType);
        this._decrementHeadroom(resolvedOldType);
      } else if (this._headroom[newType] > 0) {
        this._headroom[newType]--;
      } else {
        this._incrementType(newType);
      }
    },

    _handleStayedOutside(resolvedOldType, newType) {
      if (this._decrementHeadroom(resolvedOldType)) {
        this._incrementType(newType);
        this._headroom[newType]++;
      }
    },

    handleRoomUpdate({ wasInArray, isNowInArray, oldType, newType, roomUuid }) {
      const resolvedOldType =
        oldType || (roomUuid && this._typeCache[roomUuid]) || null;
      const typeChanged =
        resolvedOldType && newType && resolvedOldType !== newType;

      if (roomUuid && newType) this._typeCache[roomUuid] = newType;

      if (wasInArray && isNowInArray) {
        this._handleBothInArray(typeChanged, resolvedOldType, newType);
      } else if (wasInArray && !isNowInArray && resolvedOldType) {
        this._decrementType(resolvedOldType);
      } else if (!wasInArray && isNowInArray && newType) {
        this._handleEnteredArray(typeChanged, resolvedOldType, newType);
      } else if (!wasInArray && !isNowInArray && typeChanged) {
        this._handleStayedOutside(resolvedOldType, newType);
      }
    },
  },
});
