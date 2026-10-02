import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  MAX_COPILOT_READ_ROOMS,
  MAX_PROCESSED_UUIDS,
  buildCopilotReadEntryKey,
  buildCopilotReadStorageKey,
  clearRoom,
  getLastProcessed,
  getProcessedUuids,
  markProcessed,
} from '@/utils/copilotReadStorage';
import { moduleStorage } from '@/utils/storage';

const SCOPE = {
  projectUuid: 'project-1',
  agentEmail: 'agent@example.com',
  channelUuid: 'channel-1',
};
const STORAGE_KEY = buildCopilotReadStorageKey(
  SCOPE.projectUuid,
  SCOPE.agentEmail,
);
const ROOM_1_KEY = buildCopilotReadEntryKey(SCOPE.channelUuid, 'room-1');
const ROOM_2_KEY = buildCopilotReadEntryKey(SCOPE.channelUuid, 'room-2');

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

  it('stores identifiers and processed uuids for a channel and room', () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    markProcessed(SCOPE, 'room-1', {
      messageUuid: 'msg-1',
      createdOn: '2024-01-01T00:00:00Z',
    });

    expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({
      [ROOM_1_KEY]: {
        messageUuid: 'msg-1',
        createdOn: '2024-01-01T00:00:00Z',
        processedAt: now,
        processedUuids: ['msg-1'],
      },
    });
    expect(getLastProcessed(SCOPE, 'room-1').messageUuid).toBe('msg-1');
    expect(getProcessedUuids(SCOPE, 'room-1')).toEqual(['msg-1']);
  });

  it('isolates registries by project, agent and channel', () => {
    markProcessed(SCOPE, 'room-1', { messageUuid: 'msg-1' });
    markProcessed(
      {
        projectUuid: 'project-2',
        agentEmail: SCOPE.agentEmail,
        channelUuid: SCOPE.channelUuid,
      },
      'room-1',
      { messageUuid: 'other' },
    );
    markProcessed({ ...SCOPE, channelUuid: 'channel-2' }, 'room-1', {
      messageUuid: 'channel-2-msg',
    });

    expect(getLastProcessed(SCOPE, 'room-1').messageUuid).toBe('msg-1');
    expect(
      getLastProcessed({ ...SCOPE, channelUuid: 'channel-2' }, 'room-1')
        .messageUuid,
    ).toBe('channel-2-msg');
  });

  it('does not read or write without a complete scope', () => {
    markProcessed(
      { projectUuid: SCOPE.projectUuid, agentEmail: SCOPE.agentEmail },
      'room-1',
      { messageUuid: 'msg-1' },
    );

    expect(getLastProcessed(SCOPE, 'room-1')).toBeNull();
    expect(
      getLastProcessed(
        { projectUuid: SCOPE.projectUuid, agentEmail: SCOPE.agentEmail },
        'room-1',
      ),
    ).toBeNull();
    expect(moduleStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('treats corrupt storage as empty and ignores legacy room-only keys', () => {
    moduleStorage.setItem(STORAGE_KEY, 'not-an-object');
    expect(getLastProcessed(SCOPE, 'room-1')).toBeNull();

    moduleStorage.setItem(STORAGE_KEY, { 'room-1': { bad: true } });
    expect(getLastProcessed(SCOPE, 'room-1')).toBeNull();

    moduleStorage.setItem(STORAGE_KEY, {
      'room-1': {
        messageUuid: 'legacy',
        createdOn: '2024-01-01T00:00:00Z',
        processedAt: 1,
      },
    });
    expect(getLastProcessed(SCOPE, 'room-1')).toBeNull();
  });

  it('accumulates processed uuids and keeps only the last 100', () => {
    markProcessed(SCOPE, 'room-1', {
      messageUuid: 'msg-1',
      processedUuids: ['msg-1'],
    });
    markProcessed(SCOPE, 'room-1', {
      messageUuid: 'msg-2',
      processedUuids: ['msg-2'],
    });

    expect(getProcessedUuids(SCOPE, 'room-1')).toEqual(['msg-1', 'msg-2']);

    const overflow = Array.from(
      { length: MAX_PROCESSED_UUIDS + 5 },
      (_, index) => `msg-${index}`,
    );
    markProcessed(SCOPE, 'room-1', {
      messageUuid: overflow.at(-1),
      processedUuids: overflow,
    });

    const stored = getProcessedUuids(SCOPE, 'room-1');
    expect(stored).toHaveLength(MAX_PROCESSED_UUIDS);
    expect(stored[0]).toBe('msg-5');
    expect(stored.at(-1)).toBe(`msg-${MAX_PROCESSED_UUIDS + 4}`);
  });

  it('clears a room across every channel', () => {
    markProcessed(SCOPE, 'room-1', { messageUuid: 'msg-1' });
    markProcessed({ ...SCOPE, channelUuid: 'channel-2' }, 'room-1', {
      messageUuid: 'msg-channel-2',
    });
    markProcessed(SCOPE, 'room-2', { messageUuid: 'msg-2' });

    clearRoom(
      { projectUuid: SCOPE.projectUuid, agentEmail: SCOPE.agentEmail },
      'room-1',
    );

    expect(getLastProcessed(SCOPE, 'room-1')).toBeNull();
    expect(
      getLastProcessed({ ...SCOPE, channelUuid: 'channel-2' }, 'room-1'),
    ).toBeNull();
    expect(getLastProcessed(SCOPE, 'room-2').messageUuid).toBe('msg-2');
    expect(moduleStorage.getItem(STORAGE_KEY)[ROOM_2_KEY]).toBeDefined();
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
