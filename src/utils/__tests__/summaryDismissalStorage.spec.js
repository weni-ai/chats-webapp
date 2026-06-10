import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  markSummaryDismissed,
  clearSummaryDismissed,
  isSummaryDismissed,
  pruneExpiredSummaryDismissals,
  SUMMARY_DISMISSAL_TTL_MS,
} from '@/utils/summaryDismissalStorage';
import { moduleStorage } from '@/utils/storage';

const STORAGE_KEY = 'summary_dismissed_rooms';

describe('summaryDismissalStorage', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(mockLocalStorage).forEach(
          (key) => delete mockLocalStorage[key],
        );
      }),
      key: vi.fn((index) => Object.keys(mockLocalStorage)[index] ?? null),
      get length() {
        return Object.keys(mockLocalStorage).length;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('markSummaryDismissed', () => {
    it('stores the room uuid with a timestamp', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      markSummaryDismissed('room-1');

      const stored = moduleStorage.getItem(STORAGE_KEY);
      expect(stored).toEqual({ 'room-1': now });
    });

    it('ignores invalid uuids', () => {
      markSummaryDismissed('');
      markSummaryDismissed(null);
      markSummaryDismissed(undefined);
      markSummaryDismissed(123);

      expect(moduleStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('merges with existing entries', () => {
      vi.spyOn(Date, 'now').mockReturnValueOnce(1).mockReturnValueOnce(2);

      markSummaryDismissed('room-1');
      markSummaryDismissed('room-2');

      expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({
        'room-1': 1,
        'room-2': 2,
      });
    });
  });

  describe('clearSummaryDismissed', () => {
    it('removes a single entry', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10);
      markSummaryDismissed('room-1');
      markSummaryDismissed('room-2');

      clearSummaryDismissed('room-1');

      expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({ 'room-2': 10 });
    });

    it('removes the storage key entirely when the map becomes empty', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10);
      markSummaryDismissed('room-1');

      clearSummaryDismissed('room-1');

      expect(moduleStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('does nothing for unknown uuids', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10);
      markSummaryDismissed('room-1');

      clearSummaryDismissed('room-unknown');

      expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({ 'room-1': 10 });
    });

    it('ignores invalid uuids', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10);
      markSummaryDismissed('room-1');

      clearSummaryDismissed('');
      clearSummaryDismissed(null);

      expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({ 'room-1': 10 });
    });
  });

  describe('isSummaryDismissed', () => {
    it('returns false when uuid is missing or invalid', () => {
      expect(isSummaryDismissed('')).toBe(false);
      expect(isSummaryDismissed(null)).toBe(false);
      expect(isSummaryDismissed(undefined)).toBe(false);
    });

    it('returns false when uuid is not in storage', () => {
      expect(isSummaryDismissed('room-1')).toBe(false);
    });

    it('returns true when uuid was recently dismissed', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      markSummaryDismissed('room-1');

      vi.spyOn(Date, 'now').mockReturnValue(now + 1000);
      expect(isSummaryDismissed('room-1')).toBe(true);
    });

    it('returns false and prunes the entry when the TTL has expired', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      markSummaryDismissed('room-1');

      vi.spyOn(Date, 'now').mockReturnValue(now + SUMMARY_DISMISSAL_TTL_MS + 1);

      expect(isSummaryDismissed('room-1')).toBe(false);
      expect(moduleStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('treats corrupt entries as not dismissed', () => {
      mockLocalStorage[`chats_${STORAGE_KEY}`] = '"not-an-object"';
      expect(isSummaryDismissed('room-1')).toBe(false);

      mockLocalStorage[`chats_${STORAGE_KEY}`] = '[1,2,3]';
      expect(isSummaryDismissed('room-1')).toBe(false);
    });
  });

  describe('pruneExpiredSummaryDismissals', () => {
    it('removes only expired entries', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      markSummaryDismissed('room-fresh');

      vi.spyOn(Date, 'now').mockReturnValue(
        now - SUMMARY_DISMISSAL_TTL_MS - 10,
      );
      markSummaryDismissed('room-old');

      vi.spyOn(Date, 'now').mockReturnValue(now + 1);
      pruneExpiredSummaryDismissals();

      const stored = moduleStorage.getItem(STORAGE_KEY);
      expect(stored).toEqual({ 'room-fresh': now });
    });

    it('removes the storage key when all entries are expired', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(now - SUMMARY_DISMISSAL_TTL_MS - 1);
      markSummaryDismissed('room-old');

      vi.spyOn(Date, 'now').mockReturnValue(now);
      pruneExpiredSummaryDismissals();

      expect(moduleStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('is a no-op when storage is empty', () => {
      expect(() => pruneExpiredSummaryDismissals()).not.toThrow();
      expect(moduleStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
