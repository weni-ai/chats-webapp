import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  getSelectedQueues,
  setSelectedQueues,
} from '@/utils/queuesViewStorage';
import { moduleStorage } from '@/utils/storage';

const STORAGE_KEY = 'queuesView';

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'fallback-project-uuid'),
}));

describe('queuesViewStorage', () => {
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
  });

  describe('getSelectedQueues', () => {
    it('returns empty array when nothing is stored', () => {
      expect(getSelectedQueues('project-1')).toEqual([]);
    });

    it('returns selectedQueues for the given project', () => {
      moduleStorage.setItem(STORAGE_KEY, {
        'project-1': { selectedQueues: ['queue-a', 'queue-b'] },
      });

      expect(getSelectedQueues('project-1')).toEqual(['queue-a', 'queue-b']);
    });

    it('returns empty array when project entry is missing or invalid', () => {
      moduleStorage.setItem(STORAGE_KEY, {
        'project-1': { selectedQueues: 'invalid' },
        'project-2': {},
      });

      expect(getSelectedQueues('project-1')).toEqual([]);
      expect(getSelectedQueues('project-2')).toEqual([]);
      expect(getSelectedQueues('project-missing')).toEqual([]);
    });

    it('falls back to getProject when projectUuid is omitted', async () => {
      const { getProject } = await import('@/utils/config');

      moduleStorage.setItem(STORAGE_KEY, {
        'fallback-project-uuid': { selectedQueues: ['queue-x'] },
      });

      expect(getSelectedQueues()).toEqual(['queue-x']);
      expect(getProject).toHaveBeenCalled();
    });
  });

  describe('setSelectedQueues', () => {
    it('stores selectedQueues for a project', () => {
      setSelectedQueues('project-1', ['queue-1']);

      expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({
        'project-1': { selectedQueues: ['queue-1'] },
      });
    });

    it('merges with existing project entries', () => {
      setSelectedQueues('project-1', ['queue-1']);
      setSelectedQueues('project-2', ['queue-2']);

      expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({
        'project-1': { selectedQueues: ['queue-1'] },
        'project-2': { selectedQueues: ['queue-2'] },
      });
    });

    it('overwrites selectedQueues for the same project', () => {
      setSelectedQueues('project-1', ['queue-1']);
      setSelectedQueues('project-1', ['queue-2', 'queue-3']);

      expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({
        'project-1': { selectedQueues: ['queue-2', 'queue-3'] },
      });
    });

    it('stores empty selectedQueues when clearing', () => {
      setSelectedQueues('project-1', ['queue-1']);
      setSelectedQueues('project-1', []);

      expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({
        'project-1': { selectedQueues: [] },
      });
    });

    it('ignores calls without a resolvable project uuid', async () => {
      const { getProject } = await import('@/utils/config');
      getProject.mockReturnValueOnce('');

      setSelectedQueues('', ['queue-1']);

      expect(moduleStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
