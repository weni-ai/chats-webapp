import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import wsDeleteRoom from '@/services/api/websocket/listeners/room/delete';
import {
  flushPendingUpdates,
  resetBatchState,
  markPendingClose,
} from '@/services/api/websocket/listeners/room/update';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import { useFeatureFlag } from '@/store/modules/featureFlag';

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

vi.mock('@/store/modules/chats/roomCounters', () => ({
  useRoomCounters: vi.fn(),
}));

vi.mock('@/store/modules/featureFlag', () => ({
  useFeatureFlag: vi.fn(),
}));

const buildAppMock = () => ({
  me: { email: 'agent@example.com' },
  $router: { replace: vi.fn() },
  viewedAgent: { email: '' },
});

const buildRoomsStoreMock = () => ({
  rooms: [],
  removeRoom: vi.fn(),
  applyClose: vi.fn(),
  updateRoom: vi.fn(),
  resetNewMessagesByRoom: vi.fn(),
  showOngoingDot: false,
  activeTab: 'ongoing',
});

describe('Room delete (legacy path)', () => {
  let roomsStoreMock;
  let countersMock;

  beforeEach(() => {
    resetBatchState();
    roomsStoreMock = buildRoomsStoreMock();
    countersMock = {
      handleClose: vi.fn(),
      handleRoomUpdate: vi.fn(),
      clearTypeCache: vi.fn(),
    };
    useRooms.mockReturnValue(roomsStoreMock);
    useRoomCounters.mockReturnValue(countersMock);
    useFeatureFlag.mockReturnValue({
      featureFlags: { active_features: [] },
    });
  });

  afterEach(() => {
    resetBatchState();
  });

  it('calls removeRoom synchronously and decrements counter when feature flag is off', async () => {
    const room = {
      uuid: 'room1',
      user: { email: 'agent@example.com' },
      is_waiting: false,
    };
    roomsStoreMock.rooms = [room];

    await wsDeleteRoom(room, { app: buildAppMock() });

    expect(roomsStoreMock.removeRoom).toHaveBeenCalledWith('room1');
    expect(countersMock.handleClose).toHaveBeenCalledWith('ongoing');
  });
});

describe('Room delete (new unified pipeline)', () => {
  let roomsStoreMock;
  let countersMock;

  beforeEach(() => {
    resetBatchState();
    roomsStoreMock = buildRoomsStoreMock();
    countersMock = {
      handleClose: vi.fn(),
      handleRoomUpdate: vi.fn(),
      clearTypeCache: vi.fn(),
    };
    useRooms.mockReturnValue(roomsStoreMock);
    useRoomCounters.mockReturnValue(countersMock);
    useFeatureFlag.mockReturnValue({
      featureFlags: { active_features: ['WeniChatsNewRoomUpdate'] },
    });
  });

  afterEach(() => {
    resetBatchState();
  });

  it('does not mutate state synchronously, but flushes through the batch', async () => {
    const room = {
      uuid: 'room1',
      user: { email: 'agent@example.com' },
      is_waiting: false,
    };
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    await wsDeleteRoom(room, { app: buildAppMock() });

    expect(roomsStoreMock.applyClose).not.toHaveBeenCalled();
    expect(countersMock.handleClose).not.toHaveBeenCalled();

    flushPendingUpdates();

    expect(roomsStoreMock.applyClose).toHaveBeenCalledWith('room1', room);
    expect(countersMock.handleClose).toHaveBeenCalledWith('ongoing');
    expect(countersMock.clearTypeCache).toHaveBeenCalledWith('room1');
  });

  it('decrements counter only once when duplicate close events arrive', async () => {
    const room = { uuid: 'dup-room', user: null, is_waiting: false };
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    await wsDeleteRoom(room, { app: buildAppMock() });
    await wsDeleteRoom(room, { app: buildAppMock() });
    await wsDeleteRoom(room, { app: buildAppMock() });

    flushPendingUpdates();

    expect(roomsStoreMock.applyClose).toHaveBeenCalledTimes(1);
    expect(countersMock.handleClose).toHaveBeenCalledTimes(1);
  });

  it('skips counter decrement when room was optimistically closed locally', async () => {
    const room = { uuid: 'opt-room', user: null, is_waiting: false };
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    markPendingClose('opt-room');
    await wsDeleteRoom(room, { app: buildAppMock() });

    flushPendingUpdates();

    expect(roomsStoreMock.applyClose).toHaveBeenCalledWith('opt-room', room);
    expect(countersMock.handleClose).not.toHaveBeenCalled();
  });

  it('ignores rooms without uuid', async () => {
    await wsDeleteRoom({}, { app: buildAppMock() });
    flushPendingUpdates();

    expect(roomsStoreMock.applyClose).not.toHaveBeenCalled();
    expect(countersMock.handleClose).not.toHaveBeenCalled();
  });
});
