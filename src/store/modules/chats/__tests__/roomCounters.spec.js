import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from 'vue';
import { setActivePinia, createPinia } from 'pinia';

import { useRoomCounters } from '@/store/modules/chats/roomCounters';

const app = createApp({});
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);

describe('useRoomCounters', () => {
  let counters;

  beforeEach(() => {
    counters = useRoomCounters();
    counters.$reset();
  });

  describe('syncFromApi', () => {
    it('should set count and headroom from API response', () => {
      counters.syncFromApi('ongoing', 299, 100);

      expect(counters.counts.ongoing).toBe(299);
      expect(counters._headroom.ongoing).toBe(199);
    });

    it('should set headroom to 0 when local size matches API count', () => {
      counters.syncFromApi('waiting', 5, 5);

      expect(counters.counts.waiting).toBe(5);
      expect(counters._headroom.waiting).toBe(0);
    });

    it('should clamp headroom to 0 when local size exceeds API count', () => {
      counters.syncFromApi('ongoing', 3, 5);

      expect(counters.counts.ongoing).toBe(3);
      expect(counters._headroom.ongoing).toBe(0);
    });

    it('should ignore invalid types', () => {
      counters.syncFromApi('invalid', 100, 50);
      counters.syncFromApi(null, 100, 50);

      expect(counters.counts).toEqual({
        waiting: 0,
        ongoing: 0,
        flow_start: 0,
      });
    });
  });

  describe('handleCreate', () => {
    it('should increment count for the given type', () => {
      counters.syncFromApi('ongoing', 5, 5);
      counters.handleCreate('ongoing');

      expect(counters.counts.ongoing).toBe(6);
    });

    it('should ignore invalid types', () => {
      counters.handleCreate('unknown');
      counters.handleCreate(null);

      expect(counters.counts).toEqual({
        waiting: 0,
        ongoing: 0,
        flow_start: 0,
      });
    });
  });

  describe('handleClose', () => {
    it('should decrement count for the given type', () => {
      counters.syncFromApi('waiting', 10, 5);
      counters.handleClose('waiting');

      expect(counters.counts.waiting).toBe(9);
    });

    it('should clamp count to 0', () => {
      counters.handleClose('ongoing');

      expect(counters.counts.ongoing).toBe(0);
    });

    it('should ignore invalid types', () => {
      counters.syncFromApi('ongoing', 5, 5);
      counters.handleClose('unknown');

      expect(counters.counts.ongoing).toBe(5);
    });
  });

  describe('handleRoomUpdate', () => {
    describe('type transition (room stays in array)', () => {
      it('should move count between types when type changes', () => {
        counters.syncFromApi('waiting', 10, 5);
        counters.syncFromApi('ongoing', 5, 5);

        counters.handleRoomUpdate({
          wasInArray: true,
          isNowInArray: true,
          oldType: 'waiting',
          newType: 'ongoing',
        });

        expect(counters.counts.waiting).toBe(9);
        expect(counters.counts.ongoing).toBe(6);
      });

      it('should not change counts when type stays the same', () => {
        counters.syncFromApi('ongoing', 5, 5);

        counters.handleRoomUpdate({
          wasInArray: true,
          isNowInArray: true,
          oldType: 'ongoing',
          newType: 'ongoing',
        });

        expect(counters.counts.ongoing).toBe(5);
      });
    });

    describe('room removed from array (became invisible)', () => {
      it('should decrement count for the old type', () => {
        counters.syncFromApi('ongoing', 5, 5);

        counters.handleRoomUpdate({
          wasInArray: true,
          isNowInArray: false,
          oldType: 'ongoing',
          newType: 'ongoing',
        });

        expect(counters.counts.ongoing).toBe(4);
      });

      it('should clamp count to 0', () => {
        counters.handleRoomUpdate({
          wasInArray: true,
          isNowInArray: false,
          oldType: 'ongoing',
          newType: 'ongoing',
        });

        expect(counters.counts.ongoing).toBe(0);
      });
    });

    describe('room added to array (became visible)', () => {
      it('should consume headroom when available', () => {
        counters.syncFromApi('ongoing', 299, 100);

        counters.handleRoomUpdate({
          wasInArray: false,
          isNowInArray: true,
          oldType: null,
          newType: 'ongoing',
        });

        expect(counters.counts.ongoing).toBe(299);
        expect(counters._headroom.ongoing).toBe(198);
      });

      it('should increment count when headroom is exhausted', () => {
        counters.syncFromApi('ongoing', 5, 5);

        counters.handleRoomUpdate({
          wasInArray: false,
          isNowInArray: true,
          oldType: null,
          newType: 'ongoing',
        });

        expect(counters.counts.ongoing).toBe(6);
        expect(counters._headroom.ongoing).toBe(0);
      });
    });

    describe('room not added (not visible)', () => {
      it('should not change any count', () => {
        counters.syncFromApi('ongoing', 5, 5);

        counters.handleRoomUpdate({
          wasInArray: false,
          isNowInArray: false,
          oldType: null,
          newType: 'ongoing',
        });

        expect(counters.counts.ongoing).toBe(5);
      });
    });

    describe('reconnection burst scenario', () => {
      it('should not inflate counts when WS sends catch-up updates', () => {
        counters.syncFromApi('ongoing', 299, 100);

        for (let i = 0; i < 70; i++) {
          counters.handleRoomUpdate({
            wasInArray: false,
            isNowInArray: true,
            oldType: null,
            newType: 'ongoing',
          });
        }

        expect(counters.counts.ongoing).toBe(299);
        expect(counters._headroom.ongoing).toBe(129);
      });

      it('should increment after headroom is consumed', () => {
        counters.syncFromApi('ongoing', 5, 3);

        counters.handleRoomUpdate({
          wasInArray: false,
          isNowInArray: true,
          oldType: null,
          newType: 'ongoing',
        });
        counters.handleRoomUpdate({
          wasInArray: false,
          isNowInArray: true,
          oldType: null,
          newType: 'ongoing',
        });

        expect(counters.counts.ongoing).toBe(5);
        expect(counters._headroom.ongoing).toBe(0);

        counters.handleRoomUpdate({
          wasInArray: false,
          isNowInArray: true,
          oldType: null,
          newType: 'ongoing',
        });

        expect(counters.counts.ongoing).toBe(6);
      });
    });
  });
});
