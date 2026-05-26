import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import wsRoomUpdate, {
  flushPendingUpdates,
  resetBatchState,
  markPendingClose,
  unmarkPendingClose,
} from '@/services/api/websocket/listeners/room/update';
import wsDeleteRoom from '@/services/api/websocket/listeners/room/delete';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import SoundNotification from '@/services/api/websocket/soundNotification';

vi.mock('@/store/modules/dashboard', () => ({
  useDashboard: vi.fn(() => ({
    viewedAgent: { email: '' },
  })),
}));

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

vi.mock('@/store/modules/chats/roomCounters', () => ({
  useRoomCounters: vi.fn(),
}));

vi.mock('@/store/modules/featureFlag', () => ({
  useFeatureFlag: vi.fn(),
}));

vi.mock('@/services/api/websocket/soundNotification', () => ({
  default: vi.fn().mockImplementation(() => ({
    notify: vi.fn(),
  })),
}));

const buildAppMock = () => ({
  me: { email: 'user@example.com' },
  $router: { replace: vi.fn() },
  viewedAgent: { email: 'agent@example.com' },
});

const buildRoomsStoreMock = () => ({
  rooms: [],
  orderBy: {
    ongoing: '-last_interaction',
    waiting: 'added_to_queue_at',
    flow_start: '-last_interaction',
  },
  activeTab: 'ongoing',
  showOngoingDot: false,
  addRoom: vi.fn(),
  applyClose: vi.fn(),
  updateRoom: vi.fn(() => ({
    wasInArray: false,
    isNowInArray: true,
    oldType: null,
    newType: 'ongoing',
    roomUuid: 'room1',
  })),
  resetNewMessagesByRoom: vi.fn(),
  markNewChatReceived: vi.fn(),
  getAll: vi.fn().mockResolvedValue(undefined),
  filterQueues: [],
});

const buildCountersMock = () => ({
  handleClose: vi.fn(),
  handleRoomUpdate: vi.fn(),
  clearTypeCache: vi.fn(),
});

const enableNewLogic = () =>
  useFeatureFlag.mockReturnValue({
    featureFlags: { active_features: ['WeniChatsNewRoomUpdate'] },
  });

const disableNewLogic = () =>
  useFeatureFlag.mockReturnValue({
    featureFlags: { active_features: [] },
  });

describe('Room update (legacy path)', () => {
  let appMock;
  let roomsStoreMock;
  let countersMock;
  let soundNotificationMock;

  beforeEach(() => {
    resetBatchState();
    appMock = buildAppMock();
    roomsStoreMock = buildRoomsStoreMock();
    countersMock = buildCountersMock();
    useRooms.mockReturnValue(roomsStoreMock);
    useRoomCounters.mockReturnValue(countersMock);
    disableNewLogic();
    soundNotificationMock = new SoundNotification('achievement-confirmation');
    SoundNotification.mockReturnValue(soundNotificationMock);
  });

  afterEach(() => {
    resetBatchState();
  });

  it('updates the room synchronously when the feature flag is off', async () => {
    const room = {
      uuid: 'room1',
      transfer_history: { action: 'forward' },
      unread_msgs: 1,
    };

    await wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.updateRoom).toHaveBeenCalledWith({
      room,
      userEmail: appMock.me.email,
      routerReplace: expect.any(Function),
      viewedAgentEmail: appMock.viewedAgent.email,
    });
  });

  it('plays the achievement sound when transfer action is "transfer"', async () => {
    const room = {
      uuid: 'room1',
      transfer_history: { action: 'transfer' },
      unread_msgs: 1,
    };

    await wsRoomUpdate(room, { app: appMock });

    expect(soundNotificationMock.notify).toHaveBeenCalledWith();
  });

  it('resets new messages when unread_msgs is 0', async () => {
    const room = {
      uuid: 'room1',
      unread_msgs: 0,
      transfer_history: { action: 'forward' },
    };

    await wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.resetNewMessagesByRoom).toHaveBeenCalledWith({
      room: room.uuid,
    });
  });

  it('marks isNewChatReceived when the room transitions to ongoing for the current agent', async () => {
    roomsStoreMock.updateRoom.mockReturnValueOnce({
      wasInArray: false,
      isNowInArray: true,
      oldType: null,
      newType: 'ongoing',
      roomUuid: 'room1',
    });
    const room = {
      uuid: 'room1',
      user: { email: 'user@example.com' },
      unread_msgs: 0,
    };

    await wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.markNewChatReceived).toHaveBeenCalledWith('room1');
  });

  it('does not mark isNewChatReceived when the room was already ongoing', async () => {
    roomsStoreMock.updateRoom.mockReturnValueOnce({
      wasInArray: true,
      isNowInArray: true,
      oldType: 'ongoing',
      newType: 'ongoing',
      roomUuid: 'room1',
    });
    const room = {
      uuid: 'room1',
      user: { email: 'user@example.com' },
      unread_msgs: 0,
    };

    await wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.markNewChatReceived).not.toHaveBeenCalled();
  });

  it('does not mark isNewChatReceived when the room is not for the current agent', async () => {
    roomsStoreMock.updateRoom.mockReturnValueOnce({
      wasInArray: false,
      isNowInArray: true,
      oldType: null,
      newType: 'ongoing',
      roomUuid: 'room1',
    });
    const room = {
      uuid: 'room1',
      user: { email: 'other@example.com' },
      unread_msgs: 0,
    };

    await wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.markNewChatReceived).not.toHaveBeenCalled();
  });
});

describe('Room update (new unified pipeline)', () => {
  let appMock;
  let roomsStoreMock;
  let countersMock;
  let soundNotificationMock;

  beforeEach(() => {
    resetBatchState();
    appMock = buildAppMock();
    roomsStoreMock = buildRoomsStoreMock();
    countersMock = buildCountersMock();
    useRooms.mockReturnValue(roomsStoreMock);
    useRoomCounters.mockReturnValue(countersMock);
    enableNewLogic();
    soundNotificationMock = new SoundNotification('achievement-confirmation');
    SoundNotification.mockReturnValue(soundNotificationMock);
  });

  afterEach(() => {
    resetBatchState();
  });

  it('batches updates and only mutates the store after flush', async () => {
    const room = {
      uuid: 'room1',
      transfer_history: { action: 'forward' },
      unread_msgs: 0,
    };

    await wsRoomUpdate(room, { app: appMock });

    expect(roomsStoreMock.updateRoom).not.toHaveBeenCalled();

    flushPendingUpdates();

    expect(roomsStoreMock.updateRoom).toHaveBeenCalledWith(
      expect.objectContaining({ room }),
    );
    expect(roomsStoreMock.resetNewMessagesByRoom).toHaveBeenCalledWith({
      room: room.uuid,
    });
  });

  it('lets a close event in the same batch override an update for the same room (close wins)', async () => {
    const room = {
      uuid: 'room-x',
      user: { email: appMock.me.email },
      is_waiting: false,
    };
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    await wsRoomUpdate(room, { app: appMock });
    await wsDeleteRoom(room, { app: appMock });

    flushPendingUpdates();

    expect(roomsStoreMock.applyClose).toHaveBeenCalledWith('room-x', room);
    expect(countersMock.handleClose).toHaveBeenCalledWith('ongoing');
    expect(roomsStoreMock.updateRoom).not.toHaveBeenCalled();
    expect(countersMock.handleRoomUpdate).not.toHaveBeenCalled();
  });

  it('treats an update with is_active=false as an implicit close', async () => {
    const room = {
      uuid: 'room-inactive',
      user: { email: appMock.me.email },
      is_waiting: false,
      is_active: false,
    };
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    await wsRoomUpdate(room, { app: appMock });
    flushPendingUpdates();

    expect(roomsStoreMock.applyClose).toHaveBeenCalledWith(
      'room-inactive',
      room,
    );
    expect(countersMock.handleClose).toHaveBeenCalledWith('ongoing');
    expect(roomsStoreMock.updateRoom).not.toHaveBeenCalled();
  });

  it('decrements once for 10 simultaneous closes (no double counting via headroom path)', async () => {
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    for (let i = 0; i < 10; i++) {
      const room = {
        uuid: `room-${i}`,
        user: { email: appMock.me.email },
        is_waiting: false,
      };
      await wsRoomUpdate(room, { app: appMock });
      await wsDeleteRoom(room, { app: appMock });
    }

    flushPendingUpdates();

    expect(roomsStoreMock.applyClose).toHaveBeenCalledTimes(10);
    expect(countersMock.handleClose).toHaveBeenCalledTimes(10);
    expect(countersMock.handleRoomUpdate).not.toHaveBeenCalled();
  });

  it('does not decrement the counter when the close is for a room marked optimistically', async () => {
    const room = {
      uuid: 'optimistic-room',
      user: { email: appMock.me.email },
      is_waiting: false,
    };
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    markPendingClose('optimistic-room');
    await wsDeleteRoom(room, { app: appMock });
    flushPendingUpdates();

    expect(roomsStoreMock.applyClose).toHaveBeenCalledWith(
      'optimistic-room',
      room,
    );
    expect(countersMock.handleClose).not.toHaveBeenCalled();
  });

  it('drops a stale update that arrives shortly after a close (recently-closed window)', async () => {
    const room = {
      uuid: 'stale-room',
      user: { email: appMock.me.email },
      is_waiting: false,
    };
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    await wsDeleteRoom(room, { app: appMock });
    flushPendingUpdates();
    expect(roomsStoreMock.applyClose).toHaveBeenCalledTimes(1);

    await wsRoomUpdate(room, { app: appMock });
    flushPendingUpdates();

    expect(roomsStoreMock.updateRoom).not.toHaveBeenCalled();
  });

  it('schedules a reconciliation getAll for each touched type after a burst', async () => {
    const RECONCILIATION_DELAY_MS = 1500;
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    for (let i = 0; i < 5; i++) {
      const room = {
        uuid: `burst-${i}`,
        user: { email: appMock.me.email },
        is_waiting: false,
      };
      await wsDeleteRoom(room, { app: appMock });
    }

    vi.useFakeTimers();
    flushPendingUpdates();
    expect(roomsStoreMock.getAll).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(RECONCILIATION_DELAY_MS + 50);

    expect(roomsStoreMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        roomsType: 'ongoing',
        cleanRoomType: 'ongoing',
      }),
    );

    vi.useRealTimers();
  });

  it('unmarkPendingClose removes a previously marked uuid', async () => {
    const room = {
      uuid: 'unmark-room',
      user: { email: appMock.me.email },
      is_waiting: false,
    };
    roomsStoreMock.applyClose.mockReturnValue('ongoing');

    markPendingClose('unmark-room');
    unmarkPendingClose('unmark-room');

    await wsDeleteRoom(room, { app: appMock });
    flushPendingUpdates();

    expect(countersMock.handleClose).toHaveBeenCalledWith('ongoing');
  });

  it('marks isNewChatReceived after flush when a room transitions to ongoing for the current agent', async () => {
    roomsStoreMock.updateRoom.mockReturnValue({
      wasInArray: false,
      isNowInArray: true,
      oldType: null,
      newType: 'ongoing',
      roomUuid: 'transferred-room',
    });
    const room = {
      uuid: 'transferred-room',
      user: { email: appMock.me.email },
      transfer_history: { action: 'transfer' },
      unread_msgs: 0,
    };

    await wsRoomUpdate(room, { app: appMock });
    flushPendingUpdates();

    expect(roomsStoreMock.markNewChatReceived).toHaveBeenCalledWith(
      'transferred-room',
    );
  });

  it('marks isNewChatReceived on a waiting -> ongoing transition (manual take)', async () => {
    roomsStoreMock.updateRoom.mockReturnValue({
      wasInArray: true,
      isNowInArray: true,
      oldType: 'waiting',
      newType: 'ongoing',
      roomUuid: 'taken-room',
    });
    const room = {
      uuid: 'taken-room',
      user: { email: appMock.me.email },
      unread_msgs: 0,
    };

    await wsRoomUpdate(room, { app: appMock });
    flushPendingUpdates();

    expect(roomsStoreMock.markNewChatReceived).toHaveBeenCalledWith(
      'taken-room',
    );
  });

  it('does not mark isNewChatReceived when the room was already ongoing', async () => {
    roomsStoreMock.updateRoom.mockReturnValue({
      wasInArray: true,
      isNowInArray: true,
      oldType: 'ongoing',
      newType: 'ongoing',
      roomUuid: 'kept-room',
    });
    const room = {
      uuid: 'kept-room',
      user: { email: appMock.me.email },
      unread_msgs: 0,
    };

    await wsRoomUpdate(room, { app: appMock });
    flushPendingUpdates();

    expect(roomsStoreMock.markNewChatReceived).not.toHaveBeenCalled();
  });

  it('does not mark isNewChatReceived when the room is not for the current agent', async () => {
    roomsStoreMock.updateRoom.mockReturnValue({
      wasInArray: false,
      isNowInArray: true,
      oldType: null,
      newType: 'ongoing',
      roomUuid: 'other-agent-room',
    });
    const room = {
      uuid: 'other-agent-room',
      user: { email: 'other@example.com' },
      unread_msgs: 0,
    };

    await wsRoomUpdate(room, { app: appMock });
    flushPendingUpdates();

    expect(roomsStoreMock.markNewChatReceived).not.toHaveBeenCalled();
  });
});
