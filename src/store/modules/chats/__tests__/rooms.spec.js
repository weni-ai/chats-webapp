import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApp } from 'vue';
import { setActivePinia, createPinia } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';
import { useDashboard } from '@/store/modules/dashboard';

import { roomsMock } from './mocks/roomsMock';
import {
  mockProfileHumanServiceState,
  mockProfileAdminState,
} from '../../__tests__/mocks/profileMock';
import updateRoom, {
  flushPendingUpdates,
  resetBatchState,
} from '@/services/api/websocket/listeners/room/update';
import Room from '@/services/api/resources/chats/room';

const app = createApp({});
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);

const mocks = vi.hoisted(() => ({
  useProfile: vi.fn(),
}));

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    getAll: vi.fn(),
    getCanUseCopilot: vi.fn(),
    getCopilotSuggestion: vi.fn(),
  },
}));

vi.mock('@/store/modules/profile', () => ({
  useProfile: mocks.useProfile,
}));

describe('State Rooms', () => {
  // Helper functions
  const existRoomByUuid = (roomsStore, uuid) => {
    return !!roomsStore.rooms.find((room) => room.uuid === uuid);
  };

  const createRoom = (overrides = {}) => ({
    uuid: 'room1',
    user: { email: 'testing@weni.ai' },
    is_waiting: false,
    queue: { uuid: 'queue1' },
    ...overrides,
  });

  const createPinnedRoomsData = (userEmail = 'testing@weni.ai') =>
    [
      createRoom({ uuid: 'room1', is_pinned: false }),
      createRoom({ uuid: 'room2', is_pinned: true }),
      createRoom({ uuid: 'room3', is_pinned: true }),
      createRoom({ uuid: 'room4', is_pinned: false }),
      createRoom({ uuid: 'room5', is_pinned: true }),
    ].map((room) => ({ ...room, user: { email: userEmail } }));

  const testRoomUpdate = async (
    roomsStore,
    profileStore,
    dashboard,
    room,
    expectedExists = true,
  ) => {
    await updateRoom(room, {
      app: {
        ...profileStore,
        viewedAgent: dashboard.viewedAgent,
      },
    });
    flushPendingUpdates();
    expect(existRoomByUuid(roomsStore, room.uuid)).eq(expectedExists);
  };

  const testSorting = (
    getRoomsStore,
    roomData,
    updateParams,
    expectedFirstRoomUuid,
  ) => {
    const roomsStore = getRoomsStore();
    roomsStore.$patch({ rooms: roomData });

    roomsStore.updateRoom({
      room: updateParams.room,
      userEmail: updateParams.userEmail || 'testing@weni.ai',
      routerReplace: vi.fn(),
      viewedAgentEmail: updateParams.viewedAgentEmail || null,
    });

    expect(roomsStore.rooms[0].uuid).toBe(expectedFirstRoomUuid);
    if (roomsStore.rooms[0].is_pinned !== undefined) {
      expect(roomsStore.rooms[0].is_pinned).toBe(true);
    }
  };

  // Shared test suites
  const sharedBasicTests = (getRoomsStore, userType) => {
    describe(`Basic functionality - ${userType}`, () => {
      it('should add a room to the store', () => {
        const roomsStore = getRoomsStore();
        const room = { uuid: '123', name: 'Test Room' };
        roomsStore.addRoom(room);
        expect(roomsStore.rooms).toContainEqual(room);
      });

      it('should remove a room and update active room', () => {
        const roomsStore = getRoomsStore();
        roomsStore.rooms = [{ uuid: '1' }, { uuid: '2' }];
        roomsStore.activeRoom = { uuid: '1' };
        roomsStore.removeRoom('1');
        expect(roomsStore.rooms).toHaveLength(1);
        expect(roomsStore.activeRoom).toBeNull();
      });

      it('should update room messages', () => {
        const roomsStore = getRoomsStore();
        const message = { content: 'test', created_on: 'new-date' };
        roomsStore.updateMessagesByRoom({ room: 'room1', message });
        expect(roomsStore.newMessagesByRoom.room1.messages).toEqual(
          expect.arrayContaining([expect.objectContaining(message)]),
        );
      });

      it('should handle transfer selections for ongoing rooms', () => {
        const roomsStore = getRoomsStore();
        roomsStore.activeTab = 'ongoing';
        roomsStore.setSelectedOngoingRooms(['room1', 'room2']);
        roomsStore.setContactToTransfer('contact1');
        expect(roomsStore.selectedOngoingRooms).toEqual(['room1', 'room2']);
        expect(roomsStore.contactToTransfer).toBe('contact1');
      });

      it('should handle transfer selections for waiting rooms', () => {
        const roomsStore = getRoomsStore();
        roomsStore.activeTab = 'waiting';
        roomsStore.setSelectedWaitingRooms(['room3', 'room4']);
        roomsStore.setContactToTransfer('contact2');
        expect(roomsStore.selectedWaitingRooms).toEqual(['room3', 'room4']);
        expect(roomsStore.contactToTransfer).toBe('contact2');
      });

      it('should return correct rooms via currentSelectedRooms getter', () => {
        const roomsStore = getRoomsStore();
        roomsStore.activeTab = 'ongoing';
        roomsStore.selectedOngoingRooms = ['room1', 'room2'];
        roomsStore.selectedWaitingRooms = ['room3', 'room4'];
        expect(roomsStore.currentSelectedRooms).toEqual(['room1', 'room2']);

        roomsStore.activeTab = 'waiting';
        expect(roomsStore.currentSelectedRooms).toEqual(['room3', 'room4']);
      });

      it('should update last interaction', () => {
        const roomsStore = getRoomsStore();
        roomsStore.rooms = [
          { uuid: 'room1', last_interaction: 'old-date' },
          { uuid: 'room2', last_interaction: 'old-date' },
        ];

        roomsStore.updateLastInteraction({
          room: 'room1',
          lastInteraction: 'new-date',
        });

        expect(roomsStore.rooms[0].last_interaction).toBe('new-date');
      });

      it('should not update last interaction for pinned rooms', () => {
        const roomsStore = getRoomsStore();
        roomsStore.rooms = [
          { uuid: 'room1', last_interaction: 'old-date', is_pinned: true },
          { uuid: 'room2', last_interaction: 'old-date', is_pinned: false },
        ];

        roomsStore.updateLastInteraction({
          room: 'room1',
          lastInteraction: 'new-date',
        });

        expect(roomsStore.rooms[0].last_interaction).toBe('old-date');

        roomsStore.updateLastInteraction({
          room: 'room2',
          lastInteraction: 'new-date',
        });

        expect(roomsStore.rooms[1].last_interaction).toBe('new-date');
      });

      it('should bring room to front only if not pinned', () => {
        const roomsStore = getRoomsStore();
        roomsStore.rooms = [
          { uuid: 'room1', is_pinned: false },
          { uuid: 'room2', is_pinned: true },
          { uuid: 'room3', is_pinned: false },
        ];

        roomsStore.bringRoomFront(roomsStore.rooms[1]);
        expect(roomsStore.rooms[0].uuid).toBe('room1');
        expect(roomsStore.rooms[1].uuid).toBe('room2');

        roomsStore.bringRoomFront(roomsStore.rooms[2]);
        expect(roomsStore.rooms[0].uuid).toBe('room3');
        expect(roomsStore.rooms[1].uuid).toBe('room1');
        expect(roomsStore.rooms[2].uuid).toBe('room2');
      });
    });
  };

  const sharedGetterTests = (getRoomsStore, userType) => {
    describe(`Getters - ${userType}`, () => {
      beforeEach(() => {
        const roomsStore = getRoomsStore();
        roomsStore.rooms = [
          { uuid: 'agent1', user: { email: 'agent' }, is_waiting: false },
          { uuid: 'waiting1', user: null, is_waiting: false },
          { uuid: 'flow1', user: { email: 'user' }, is_waiting: true },
        ];
      });

      it('should filter rooms correctly by type', () => {
        const roomsStore = getRoomsStore();
        expect(roomsStore.agentRooms).toHaveLength(1);
        expect(roomsStore.waitingQueue).toHaveLength(1);
        expect(roomsStore.waitingContactAnswer).toHaveLength(1);
        expect(roomsStore.getRoomById('agent1')).toEqual(roomsStore.rooms[0]);
      });
    });
  };

  const sharedPinTests = (getRoomsStore, userType, queueUuid = 'queue1') => {
    describe(`Pin functionality - ${userType}`, () => {
      beforeEach(() => {
        const roomsStore = getRoomsStore();
        roomsStore.$patch({
          rooms: createPinnedRoomsData().map((room) => ({
            ...room,
            queue: { uuid: queueUuid },
          })),
          maxPinLimit: 5,
        });
      });

      it('should handle maxPinLimit settings', async () => {
        const roomsStore = getRoomsStore();
        const testCases = [
          { max_pin_limit: 10, expected: 10 },
          { max_pin_limit: undefined, expected: 0 },
        ];

        for (const testCase of testCases) {
          Room.getAll.mockResolvedValue({
            results: [{ uuid: '1' }],
            next: true,
            ...testCase,
          });
          await roomsStore.getAll({ offset: 0, limit: 1 });
          expect(roomsStore.maxPinLimit).toBe(testCase.expected);
        }
      });

      it('should count pinned rooms correctly', () => {
        const roomsStore = getRoomsStore();
        const pinnedAgentRooms = roomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        );
        expect(pinnedAgentRooms.length).toBeGreaterThan(0);
      });

      it('should handle rooms with and without is_pinned property', () => {
        const roomsStore = getRoomsStore();
        roomsStore.$patch({
          rooms: [
            createRoom({ uuid: 'room1' }), // no is_pinned
            createRoom({ uuid: 'room2', is_pinned: true }),
            createRoom({ uuid: 'room3', is_pinned: false }),
          ],
        });

        const pinnedAgentRooms = roomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        );
        expect(pinnedAgentRooms).toHaveLength(1);
      });

      it('should maintain pin state when managing rooms', () => {
        const roomsStore = getRoomsStore();
        const initialPinnedCount = roomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        ).length;

        // Add new pinned room
        roomsStore.addRoom(createRoom({ uuid: 'room6', is_pinned: true }));
        expect(
          roomsStore.agentRooms.filter((room) => room.is_pinned),
        ).toHaveLength(initialPinnedCount + 1);

        // Remove pinned room
        roomsStore.removeRoom('room2');
        expect(
          roomsStore.agentRooms.filter((room) => room.is_pinned),
        ).toHaveLength(initialPinnedCount);
      });

      it('should handle mixed room types with pin states', () => {
        const roomsStore = getRoomsStore();
        roomsStore.$patch({
          rooms: [
            {
              uuid: 'agent1',
              is_pinned: true,
              user: { email: 'agent' },
              is_waiting: false,
            },
            {
              uuid: 'waiting1',
              is_pinned: true,
              user: null,
              is_waiting: false,
            },
            {
              uuid: 'flow1',
              is_pinned: true,
              user: { email: 'user' },
              is_waiting: true,
            },
          ],
        });

        expect(roomsStore.agentRooms.filter((r) => r.is_pinned)).toHaveLength(
          1,
        );
        expect(roomsStore.waitingQueue.filter((r) => r.is_pinned)).toHaveLength(
          1,
        );
        expect(
          roomsStore.waitingContactAnswer.filter((r) => r.is_pinned),
        ).toHaveLength(1);
      });
    });
  };

  const sharedSortingTests = (
    getRoomsStore,
    userType,
    queueUuid = 'queue1',
  ) => {
    describe(`Sorting functionality - ${userType}`, () => {
      const roomData = [
        createRoom({
          uuid: 'room1',
          is_pinned: false,
          queue: { uuid: queueUuid },
        }),
        createRoom({
          uuid: 'room2',
          is_pinned: true,
          queue: { uuid: queueUuid },
        }),
        createRoom({
          uuid: 'room3',
          is_pinned: false,
          queue: { uuid: queueUuid },
        }),
      ];

      it('should sort pinned rooms first when updating', () => {
        testSorting(
          getRoomsStore,
          roomData,
          {
            room: createRoom({ uuid: 'room1', queue: { uuid: queueUuid } }),
          },
          'room2',
        );
      });

      it('should handle mixed is_pinned states', () => {
        const mixedData = [
          createRoom({
            uuid: 'room1',
            is_pinned: false,
            queue: { uuid: queueUuid },
          }),
          createRoom({
            uuid: 'room2',
            is_pinned: true,
            queue: { uuid: queueUuid },
          }),
          createRoom({ uuid: 'room3', queue: { uuid: queueUuid } }), // no is_pinned
          createRoom({
            uuid: 'room4',
            is_pinned: true,
            queue: { uuid: queueUuid },
          }),
        ];

        testSorting(
          getRoomsStore,
          mixedData,
          {
            room: createRoom({ uuid: 'room1', queue: { uuid: queueUuid } }),
          },
          'room2',
        );

        const roomsStore = getRoomsStore();
        const pinnedRooms = roomsStore.rooms.filter(
          (r) => r.is_pinned === true,
        );
        const firstPinnedIndex = roomsStore.rooms.findIndex(
          (r) => r.is_pinned === true,
        );
        const firstUnpinnedIndex = roomsStore.rooms.findIndex(
          (r) => r.is_pinned === false,
        );

        expect(pinnedRooms).toHaveLength(2);
        if (firstPinnedIndex !== -1 && firstUnpinnedIndex !== -1) {
          expect(firstPinnedIndex).toBeLessThan(firstUnpinnedIndex);
        }
      });

      it('should maintain original order when no is_pinned properties exist', () => {
        const roomsStore = getRoomsStore();
        const noPinData = [
          createRoom({ uuid: 'room1', queue: { uuid: queueUuid } }),
          createRoom({ uuid: 'room2', queue: { uuid: queueUuid } }),
          createRoom({ uuid: 'room3', queue: { uuid: queueUuid } }),
        ];

        roomsStore.$patch({ rooms: noPinData });
        const originalOrder = roomsStore.rooms.map((r) => r.uuid);

        roomsStore.updateRoom({
          room: createRoom({ uuid: 'room2', queue: { uuid: queueUuid } }),
          userEmail: 'testing@weni.ai',
          routerReplace: vi.fn(),
          viewedAgentEmail: null,
        });

        const newOrder = roomsStore.rooms.map((r) => r.uuid);
        expect(newOrder).toEqual(originalOrder);
      });
    });
  };

  describe('Admin User', () => {
    let adminRoomsStore, adminProfileStore, dashboardStore;

    beforeEach(() => {
      resetBatchState();
      mocks.useProfile.mockReturnValue(mockProfileAdminState);
      adminProfileStore = useProfile();
      adminRoomsStore = useRooms();
      adminRoomsStore.$patch({ rooms: [...roomsMock] });
      dashboardStore = dashboardStore?.$reset() || useDashboard();
    });

    sharedBasicTests(() => adminRoomsStore, 'Admin');
    sharedGetterTests(() => adminRoomsStore, 'Admin');
    sharedPinTests(() => adminRoomsStore, 'Admin');
    sharedSortingTests(() => adminRoomsStore, 'Admin');

    describe('Admin-specific functionality', () => {
      it('should handle copilot functionality', async () => {
        adminRoomsStore.activeRoom = { uuid: '123' };

        // Test copilot availability
        Room.getCanUseCopilot.mockResolvedValue({
          can_use_chat_completion: true,
        });
        await adminRoomsStore.getCanUseCopilot();
        expect(adminRoomsStore.canUseCopilot).toBe(true);

        // Test copilot suggestion
        Room.getCopilotSuggestion.mockResolvedValue({
          choices: [{ message: { content: 'test suggestion' } }],
          status: 200,
        });
        await adminRoomsStore.getCopilotSuggestion();
        expect(adminRoomsStore.copilotSuggestion).toBe('test suggestion');
      });

      it('should handle room visibility for admin users', async () => {
        // Admin can see room not in queue
        await testRoomUpdate(
          adminRoomsStore,
          adminProfileStore,
          dashboardStore,
          { uuid: '1', queue: { uuid: '1' } },
          true,
        );

        // Admin can see room when viewing agent
        dashboardStore.$patch({ viewedAgent: { email: 'testing@weni.ai' } });
        await testRoomUpdate(
          adminRoomsStore,
          adminProfileStore,
          dashboardStore,
          {
            uuid: '2',
            queue: { uuid: '1' },
            user: { email: 'testing@weni.ai' },
          },
          true,
        );
      });

      it('should handle transferred room by viewing agent', async () => {
        dashboardStore.$patch({ viewedAgent: { email: 'testing@weni.ai' } });
        adminRoomsStore.$patch({ activeRoom: adminRoomsStore.rooms[0] });

        await updateRoom(
          {
            ...adminRoomsStore.rooms[0],
            user: null,
            transferred_by: 'testing@weni.ai',
          },
          {
            app: {
              ...adminProfileStore,
              viewedAgent: { email: 'testing@weni.ai' },
            },
          },
        );
        flushPendingUpdates();

        expect(adminRoomsStore.activeRoom).eq(null);
      });
    });
  });

  describe('Human Service User', () => {
    let humanServiceRoomsStore, humanServiceProfileStore, dashboardStore;

    beforeEach(() => {
      resetBatchState();
      mocks.useProfile.mockReturnValue(mockProfileHumanServiceState);
      humanServiceProfileStore = useProfile();
      humanServiceRoomsStore = useRooms();
      humanServiceRoomsStore.$patch({ rooms: [...roomsMock] });
      dashboardStore = dashboardStore?.$reset() || useDashboard();
    });

    sharedBasicTests(() => humanServiceRoomsStore, 'Human Service');
    sharedGetterTests(() => humanServiceRoomsStore, 'Human Service');
    sharedPinTests(() => humanServiceRoomsStore, 'Human Service', '1');
    sharedSortingTests(() => humanServiceRoomsStore, 'Human Service', '1');

    describe('Human Service-specific functionality', () => {
      it('should handle queue permissions', async () => {
        // Should remove room if user not in queue
        await testRoomUpdate(
          humanServiceRoomsStore,
          humanServiceProfileStore,
          dashboardStore,
          { uuid: '1', queue: { uuid: '3' } },
          false,
        );

        // Should view room if transferred to user
        await testRoomUpdate(
          humanServiceRoomsStore,
          humanServiceProfileStore,
          dashboardStore,
          {
            uuid: '2',
            queue: { uuid: '3' },
            user: { email: 'testing@weni.ai' },
          },
          true,
        );

        // Should not view room without queue access
        await testRoomUpdate(
          humanServiceRoomsStore,
          humanServiceProfileStore,
          dashboardStore,
          { uuid: '4', queue: { uuid: '2' } },
          false,
        );
      });

      it('should handle room transfers', async () => {
        const routerReplace = vi.fn();
        const roomWithAssignee = {
          ...humanServiceRoomsStore.rooms[0],
          user: { email: 'testing@weni.ai' },
        };
        humanServiceRoomsStore.$patch({
          rooms: [roomWithAssignee, ...humanServiceRoomsStore.rooms.slice(1)],
          activeRoom: roomWithAssignee,
        });
        const roomUuid = humanServiceRoomsStore.activeRoom.uuid;

        await updateRoom(
          {
            ...humanServiceRoomsStore.activeRoom,
            user: { email: 'testing-adm@weni.ai' },
          },
          {
            app: {
              ...humanServiceProfileStore,
              viewedAgent: dashboardStore.viewedAgent,
              $router: { replace: routerReplace },
            },
          },
        );
        flushPendingUpdates();

        expect(humanServiceRoomsStore.activeRoom).eq(null);
        expect(routerReplace).toHaveBeenCalled();
        expect(existRoomByUuid(humanServiceRoomsStore, roomUuid)).eq(false);
      });
    });
  });

  describe('applyClose', () => {
    let roomsStore;

    beforeEach(() => {
      mocks.useProfile.mockReturnValue(mockProfileAdminState);
      roomsStore = useRooms();
      roomsStore.$patch({
        rooms: [
          { uuid: 'r1', user: { email: 'a' }, is_waiting: false },
          { uuid: 'r2', user: null, is_waiting: false },
        ],
        activeRoom: null,
      });
    });

    it('removes the room from the array and returns the resolved roomType', () => {
      const roomType = roomsStore.applyClose('r1');

      expect(roomType).toBe('ongoing');
      expect(existRoomByUuid(roomsStore, 'r1')).toBe(false);
    });

    it('falls back to the provided room payload when the local room is gone', () => {
      const fallback = { uuid: 'gone', user: null, is_waiting: true };

      const roomType = roomsStore.applyClose('gone', fallback);

      expect(roomType).toBe('flow_start');
    });

    it('returns null when the uuid is missing and there is no fallback', () => {
      expect(roomsStore.applyClose('missing')).toBeNull();
      expect(roomsStore.applyClose(null)).toBeNull();
    });

    it('clears the active room when the closed room was active', () => {
      const room = {
        uuid: 'r-active',
        user: { email: 'a' },
        is_waiting: false,
      };
      roomsStore.$patch({ rooms: [room], activeRoom: room });

      roomsStore.applyClose('r-active');

      expect(roomsStore.activeRoom).toBeNull();
    });
  });

  describe('updateRoom (alreadyClosedThisBatch guard)', () => {
    let roomsStore;
    const userEmail = 'testing@weni.ai';

    beforeEach(() => {
      mocks.useProfile.mockReturnValue(mockProfileAdminState);
      roomsStore = useRooms();
      roomsStore.$patch({ rooms: [] });
    });

    it('does not re-add a closed room when alreadyClosedThisBatch is true', () => {
      const room = {
        uuid: 'r-closed',
        user: { email: userEmail },
        is_waiting: false,
      };

      roomsStore.updateRoom({
        room,
        userEmail,
        routerReplace: vi.fn(),
        viewedAgentEmail: null,
        alreadyClosedThisBatch: true,
      });

      expect(existRoomByUuid(roomsStore, 'r-closed')).toBe(false);
    });
  });

  describe('isNewChatReceived flag', () => {
    let roomsStore;

    beforeEach(() => {
      mocks.useProfile.mockReturnValue(mockProfileAdminState);
      roomsStore = useRooms();
      roomsStore.$patch({
        rooms: [
          { uuid: 'r1', user: { email: 'a' }, is_waiting: false },
          { uuid: 'r2', user: { email: 'b' }, is_waiting: false },
        ],
        activeRoom: null,
      });
    });

    it('markNewChatReceived sets isNewChatReceived to true on the target room', () => {
      roomsStore.markNewChatReceived('r1');

      const room = roomsStore.rooms.find((r) => r.uuid === 'r1');
      expect(room.isNewChatReceived).toBe(true);

      const untouched = roomsStore.rooms.find((r) => r.uuid === 'r2');
      expect(untouched.isNewChatReceived).toBeUndefined();
    });

    it('markNewChatReceived is a no-op when uuid is missing or unknown', () => {
      roomsStore.markNewChatReceived(undefined);
      roomsStore.markNewChatReceived(null);
      roomsStore.markNewChatReceived('does-not-exist');

      expect(
        roomsStore.rooms.every((r) => r.isNewChatReceived === undefined),
      ).toBe(true);
    });

    it('clearNewChatReceived sets isNewChatReceived to false on the target room', () => {
      roomsStore.markNewChatReceived('r1');
      roomsStore.clearNewChatReceived('r1');

      const room = roomsStore.rooms.find((r) => r.uuid === 'r1');
      expect(room.isNewChatReceived).toBe(false);
    });

    it('clearNewChatReceived is a no-op when uuid is missing or already cleared', () => {
      const originalRooms = JSON.parse(JSON.stringify(roomsStore.rooms));

      roomsStore.clearNewChatReceived(undefined);
      roomsStore.clearNewChatReceived(null);
      roomsStore.clearNewChatReceived('does-not-exist');
      roomsStore.clearNewChatReceived('r1');

      expect(roomsStore.rooms).toEqual(originalRooms);
    });

    it('setActiveRoom clears isNewChatReceived on the activated room', () => {
      roomsStore.markNewChatReceived('r1');

      roomsStore.setActiveRoom({ uuid: 'r1' });

      const room = roomsStore.rooms.find((r) => r.uuid === 'r1');
      expect(room.isNewChatReceived).toBe(false);
      expect(roomsStore.activeRoom).toEqual({ uuid: 'r1' });
    });

    it('setActiveRoom does not throw when the room is null', () => {
      expect(() => roomsStore.setActiveRoom(null)).not.toThrow();
      expect(roomsStore.activeRoom).toBeNull();
    });

    it('setActiveRoom does not throw when the room has no uuid', () => {
      expect(() => roomsStore.setActiveRoom({})).not.toThrow();
      expect(roomsStore.activeRoom).toEqual({});
    });

    it('updateRoom preserves isNewChatReceived when the same room receives a subsequent payload from the socket', () => {
      const userEmail = 'me@weni.ai';
      const initialRoom = {
        uuid: 'transferred',
        user: { email: userEmail },
        is_waiting: false,
      };

      roomsStore.$patch({ rooms: [initialRoom] });
      roomsStore.markNewChatReceived('transferred');
      expect(
        roomsStore.rooms.find((r) => r.uuid === 'transferred')
          ?.isNewChatReceived,
      ).toBe(true);

      // a follow-up rooms.update for the same room (e.g. the second event the
      // backend emits right after a transfer) must not wipe the client-side
      // indicator
      roomsStore.updateRoom({
        room: {
          uuid: 'transferred',
          user: { email: userEmail },
          is_waiting: false,
          modified_on: '2026-05-27T10:59:49.500Z',
        },
        userEmail,
        routerReplace: vi.fn(),
        viewedAgentEmail: null,
      });

      expect(
        roomsStore.rooms.find((r) => r.uuid === 'transferred')
          ?.isNewChatReceived,
      ).toBe(true);
    });
  });

  describe('getAll pinned_rooms', () => {
    let roomsStore;

    const ongoingRoom = (overrides = {}) =>
      createRoom({
        last_interaction: '2024-01-01T00:00:00Z',
        ...overrides,
      });

    beforeEach(() => {
      mocks.useProfile.mockReturnValue(mockProfileHumanServiceState);
      roomsStore = useRooms();
      roomsStore.rooms = [];
      roomsStore.pinnedRooms = [];
      Room.getAll.mockReset();
    });

    it('merges pinned_rooms absent from results into agentRooms at the top', async () => {
      const pinnedOnly = ongoingRoom({
        uuid: 'pinned-only',
        is_pinned: true,
        last_interaction: '2023-01-01T00:00:00Z',
      });
      const regularRoom = ongoingRoom({
        uuid: 'regular',
        is_pinned: false,
        last_interaction: '2024-06-01T00:00:00Z',
      });

      Room.getAll.mockResolvedValue({
        results: [regularRoom],
        pinned_rooms: [pinnedOnly],
        next: false,
        count: 2,
        max_pin_limit: 5,
      });

      await roomsStore.getAll({
        offset: 0,
        limit: 30,
        roomsType: 'ongoing',
      });

      expect(roomsStore.pinnedRooms).toEqual([pinnedOnly]);
      expect(roomsStore.agentRooms).toHaveLength(2);
      expect(roomsStore.agentRooms[0].uuid).toBe('pinned-only');
      expect(roomsStore.agentRooms[0].is_pinned).toBe(true);
      expect(roomsStore.agentRooms[1].uuid).toBe('regular');
      expect(roomsStore.maxPinLimit).toBe(5);
    });

    it('keeps pinned rooms at the top of rooms after paginated concat without duplicates', async () => {
      const pinnedRoom = ongoingRoom({
        uuid: 'pinned',
        is_pinned: true,
        last_interaction: '2023-01-01T00:00:00Z',
      });
      const pageOneRoom = ongoingRoom({
        uuid: 'page-one',
        last_interaction: '2024-05-01T00:00:00Z',
      });

      Room.getAll.mockResolvedValueOnce({
        results: [pageOneRoom],
        pinned_rooms: [pinnedRoom],
        next: true,
        count: 3,
      });

      await roomsStore.getAll({
        offset: 0,
        limit: 30,
        roomsType: 'ongoing',
      });

      const pageTwoRoom = ongoingRoom({
        uuid: 'page-two',
        last_interaction: '2024-06-01T00:00:00Z',
      });
      const updatedPinnedRoom = {
        ...pinnedRoom,
        last_interaction: '2024-06-02T00:00:00Z',
      };

      Room.getAll.mockResolvedValueOnce({
        results: [pageTwoRoom],
        pinned_rooms: [updatedPinnedRoom],
        next: false,
        count: 3,
      });

      await roomsStore.getAll({
        offset: 30,
        limit: 30,
        roomsType: 'ongoing',
        concat: true,
      });

      expect(roomsStore.rooms[0].uuid).toBe('pinned');
      expect(roomsStore.rooms[0].last_interaction).toBe('2024-06-02T00:00:00Z');
      expect(
        roomsStore.rooms.filter((room) => room.uuid === 'pinned'),
      ).toHaveLength(1);
      expect(roomsStore.agentRooms[0].uuid).toBe('pinned');
      expect(roomsStore.agentRooms.map((room) => room.uuid)).toEqual(
        expect.arrayContaining(['pinned', 'page-one', 'page-two']),
      );
    });

    it('does not throw and keeps existing rooms when pinned_rooms is missing or empty', async () => {
      const existingRoom = ongoingRoom({ uuid: 'existing', is_pinned: false });
      roomsStore.rooms = [existingRoom];

      Room.getAll.mockResolvedValue({
        results: [ongoingRoom({ uuid: 'new-room' })],
        next: false,
        count: 2,
      });

      await roomsStore.getAll({
        offset: 0,
        limit: 30,
        roomsType: 'ongoing',
        concat: true,
      });

      expect(roomsStore.pinnedRooms).toEqual([]);
      expect(roomsStore.agentRooms.map((room) => room.uuid)).toEqual(
        expect.arrayContaining(['existing', 'new-room']),
      );

      Room.getAll.mockResolvedValue({
        results: [],
        pinned_rooms: [],
        next: false,
        count: 1,
      });

      await roomsStore.getAll({
        offset: 0,
        limit: 30,
        roomsType: 'ongoing',
        concat: true,
      });

      expect(roomsStore.pinnedRooms).toEqual([]);
      expect(roomsStore.agentRooms.map((room) => room.uuid)).toEqual(
        expect.arrayContaining(['existing', 'new-room']),
      );
    });

    it('clears is_pinned on rooms removed from pinned_rooms when not in new results', async () => {
      const stalePinned = ongoingRoom({
        uuid: 'stale-pinned',
        is_pinned: true,
      });

      roomsStore.rooms = [stalePinned];
      roomsStore.pinnedRooms = [stalePinned];

      Room.getAll.mockResolvedValue({
        results: [ongoingRoom({ uuid: 'other' })],
        pinned_rooms: [],
        next: false,
        count: 1,
      });

      await roomsStore.getAll({
        offset: 0,
        limit: 30,
        roomsType: 'ongoing',
        concat: true,
      });

      const staleRoom = roomsStore.rooms.find(
        (room) => room.uuid === 'stale-pinned',
      );
      expect(staleRoom?.is_pinned).toBe(false);
      expect(
        roomsStore.agentRooms.filter((room) => room.is_pinned),
      ).toHaveLength(0);
    });

    it('ignores pinned_rooms for non-ongoing room types', async () => {
      const waitingRoom = {
        uuid: 'waiting-room',
        user: null,
        is_waiting: false,
        queue: { uuid: 'queue1' },
        added_to_queue_at: '2024-01-01T00:00:00Z',
      };
      const pinnedOngoing = ongoingRoom({ uuid: 'pinned-ongoing' });

      Room.getAll.mockResolvedValue({
        results: [waitingRoom],
        pinned_rooms: [pinnedOngoing],
        next: false,
        count: 1,
      });

      await roomsStore.getAll({
        offset: 0,
        limit: 30,
        roomsType: 'waiting',
      });

      expect(roomsStore.pinnedRooms).toEqual([]);
      expect(roomsStore.waitingQueue).toHaveLength(1);
      expect(roomsStore.waitingQueue[0].uuid).toBe('waiting-room');
      expect(roomsStore.agentRooms).toHaveLength(0);
    });
  });

  describe('setOpenActiveRoomSummary', () => {
    let roomsStore;

    beforeEach(async () => {
      const summaryDismissalStorage = await import(
        '@/utils/summaryDismissalStorage'
      );
      vi.spyOn(
        summaryDismissalStorage,
        'markSummaryDismissed',
      ).mockImplementation(() => {});
      vi.spyOn(
        summaryDismissalStorage,
        'clearSummaryDismissed',
      ).mockImplementation(() => {});

      mocks.useProfile.mockReturnValue(mockProfileAdminState);
      roomsStore = useRooms();
      roomsStore.openActiveRoomSummary = false;
    });

    it('updates openActiveRoomSummary state', () => {
      roomsStore.setOpenActiveRoomSummary(true, 'room-1');
      expect(roomsStore.openActiveRoomSummary).toBe(true);

      roomsStore.setOpenActiveRoomSummary(false, 'room-1');
      expect(roomsStore.openActiveRoomSummary).toBe(false);
    });

    it('marks the room as dismissed when closing', async () => {
      const summaryDismissalStorage = await import(
        '@/utils/summaryDismissalStorage'
      );

      roomsStore.setOpenActiveRoomSummary(false, 'room-1');

      expect(summaryDismissalStorage.markSummaryDismissed).toHaveBeenCalledWith(
        'room-1',
      );
      expect(
        summaryDismissalStorage.clearSummaryDismissed,
      ).not.toHaveBeenCalled();
    });

    it('clears the dismissal when reopening', async () => {
      const summaryDismissalStorage = await import(
        '@/utils/summaryDismissalStorage'
      );

      roomsStore.setOpenActiveRoomSummary(true, 'room-1');

      expect(
        summaryDismissalStorage.clearSummaryDismissed,
      ).toHaveBeenCalledWith('room-1');
      expect(
        summaryDismissalStorage.markSummaryDismissed,
      ).not.toHaveBeenCalled();
    });

    it('does not touch storage when no roomUuid is provided', async () => {
      const summaryDismissalStorage = await import(
        '@/utils/summaryDismissalStorage'
      );

      roomsStore.setOpenActiveRoomSummary(true);
      roomsStore.setOpenActiveRoomSummary(false);

      expect(
        summaryDismissalStorage.markSummaryDismissed,
      ).not.toHaveBeenCalled();
      expect(
        summaryDismissalStorage.clearSummaryDismissed,
      ).not.toHaveBeenCalled();
    });
  });
});
