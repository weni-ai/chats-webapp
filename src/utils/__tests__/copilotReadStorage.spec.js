import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  MAX_COPILOT_READ_ROOMS,
  buildCopilotReadStorageKey,
  clearRoom,
  getLastProcessed,
  markProcessed,
} from '@/utils/copilotReadStorage';
import { moduleStorage } from '@/utils/storage';

const SCOPE = { projectUuid: 'project-1', agentEmail: 'agent@example.com' };
const STORAGE_KEY = buildCopilotReadStorageKey(
  SCOPE.projectUuid,
  SCOPE.agentEmail,
);

describe('copilotReadStorage', () => {
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

  it('stores only identifiers for a room', () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    markProcessed(SCOPE, 'room-1', {
      messageUuid: 'msg-1',
      createdOn: '2024-01-01T00:00:00Z',
    });

    expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({
      'room-1': {
        messageUuid: 'msg-1',
        createdOn: '2024-01-01T00:00:00Z',
        processedAt: now,
      },
    });
    expect(getLastProcessed(SCOPE, 'room-1').messageUuid).toBe('msg-1');
  });

  it('isolates registries by project and agent', () => {
    markProcessed(SCOPE, 'room-1', { messageUuid: 'msg-1' });
    markProcessed(
      { projectUuid: 'project-2', agentEmail: SCOPE.agentEmail },
      'room-1',
      { messageUuid: 'other' },
    );

    expect(getLastProcessed(SCOPE, 'room-1').messageUuid).toBe('msg-1');
  });

  it('treats corrupt storage as empty', () => {
    moduleStorage.setItem(STORAGE_KEY, 'not-an-object');
    expect(getLastProcessed(SCOPE, 'room-1')).toBeNull();

    moduleStorage.setItem(STORAGE_KEY, { 'room-1': { bad: true } });
    expect(getLastProcessed(SCOPE, 'room-1')).toBeNull();
  });

  it('clears a single room', () => {
    markProcessed(SCOPE, 'room-1', { messageUuid: 'msg-1' });
    markProcessed(SCOPE, 'room-2', { messageUuid: 'msg-2' });

    clearRoom(SCOPE, 'room-1');

    expect(getLastProcessed(SCOPE, 'room-1')).toBeNull();
    expect(getLastProcessed(SCOPE, 'room-2').messageUuid).toBe('msg-2');
  });

  it('keeps at most 200 rooms and discards the oldest processed first', () => {
    vi.spyOn(Date, 'now').mockImplementation(() => 0);

    for (let index = 0; index < MAX_COPILOT_READ_ROOMS; index += 1) {
      Date.now.mockReturnValue(index);
      markProcessed(SCOPE, `room-${index}`, { messageUuid: `msg-${index}` });
    }

    Date.now.mockReturnValue(MAX_COPILOT_READ_ROOMS);
    markProcessed(SCOPE, 'room-new', { messageUuid: 'msg-new' });

    expect(getLastProcessed(SCOPE, 'room-0')).toBeNull();
    expect(getLastProcessed(SCOPE, 'room-new').messageUuid).toBe('msg-new');
    expect(Object.keys(moduleStorage.getItem(STORAGE_KEY))).toHaveLength(
      MAX_COPILOT_READ_ROOMS,
    );
  });
});
