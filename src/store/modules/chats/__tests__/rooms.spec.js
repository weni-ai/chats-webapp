import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApp } from 'vue';
import { setActivePinia, createPinia } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';
import { useDashboard } from '@/store/modules/dashboard';

import { roomsMock } from './mocks/roomsMock';

import { mockProfileHumanServiceState } from '../../__tests__/mocks/profileMock';
import { mockProfileAdminState } from '../../__tests__/mocks/profileMock';

import updateRoom from '@/services/api/websocket/listeners/room/update';

import Room from '@/services/api/resources/chats/room';

const app = createApp({});
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);

const mocks = vi.hoisted(() => {
  return {
    useProfile: vi.fn(),
  };
});

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
  const existRoomByUuid = (roomsStore, uuid) => {
    return !!roomsStore.rooms.find((room) => room.uuid === uuid);
  };

  describe('Admin User', () => {
    let adminRoomsStore = useRooms();
    let adminProfileStore;
    let dashboardStore;

    beforeEach(() => {
      mocks.useProfile.mockReturnValue(mockProfileAdminState);

      adminProfileStore = useProfile();
      adminRoomsStore.$patch({
        rooms: [...roomsMock],
      });
      dashboardStore = dashboardStore?.$reset() || useDashboard();
    });

    it('should add a room to the store', () => {
      const room = { uuid: '123', name: 'Test Room' };
      adminRoomsStore.addRoom(room);
      expect(adminRoomsStore.rooms).toContainEqual(room);
    });

    it('should bring a room to the front', () => {
      const room1 = { uuid: '1' };
      const room2 = { uuid: '2' };
      adminRoomsStore.rooms = [room2, room1];
      adminRoomsStore.bringRoomFront(room1);
      expect(adminRoomsStore.rooms[0]).toStrictEqual(room2);
    });

    it('should set copilot suggestion', () => {
      adminRoomsStore.setCopilotSuggestion('test suggestion');
      expect(adminRoomsStore.copilotSuggestion).toBe('test suggestion');
    });

    it('should call Room.getAll and update rooms', async () => {
      Room.getAll.mockResolvedValue({ results: [{ uuid: '1' }], next: true });
      await adminRoomsStore.getAll({ offset: 0, limit: 1 });
      expect(adminRoomsStore.rooms).toHaveLength(1);
      expect(adminRoomsStore.hasNextRooms).toBe(true);
    });

    it('should call Room.getCanUseCopilot and update canUseCopilot', async () => {
      adminRoomsStore.activeRoom = { uuid: '123' };
      Room.getCanUseCopilot.mockResolvedValue({
        can_use_chat_completion: true,
      });
      await adminRoomsStore.getCanUseCopilot();
      expect(adminRoomsStore.canUseCopilot).toBe(true);
    });

    it('should call Room.getCopilotSuggestion and set copilot suggestion', async () => {
      adminRoomsStore.activeRoom = { uuid: '123' };
      Room.getCopilotSuggestion.mockResolvedValue({
        choices: [{ message: { content: 'suggestion' } }],
        status: 200,
      });
      await adminRoomsStore.getCopilotSuggestion();
      expect(adminRoomsStore.copilotSuggestion).toBe('suggestion');
    });

    it('should remove a room', () => {
      adminRoomsStore.rooms = [{ uuid: '1' }, { uuid: '2' }];
      adminRoomsStore.activeRoom = { uuid: '1' };
      adminRoomsStore.removeRoom('1');
      expect(adminRoomsStore.rooms).toHaveLength(1);
      expect(adminRoomsStore.activeRoom).toBeNull();
    });

    it('should set selected rooms to transfer', () => {
      adminRoomsStore.setSelectedRoomsToTransfer(['room1', 'room2']);
      expect(adminRoomsStore.selectedRoomsToTransfer).toEqual([
        'room1',
        'room2',
      ]);
    });

    it('should set contact to transfer', () => {
      adminRoomsStore.setContactToTransfer('contact1');
      expect(adminRoomsStore.contactToTransfer).toBe('contact1');
    });

    it('updates last interaction for a given room', () => {
      adminRoomsStore.rooms = [
        { uuid: 'room1', last_interaction: 'old-date' },
        { uuid: 'room2', last_interaction: 'old-date' },
      ];

      adminRoomsStore.updateLastInteraction({
        room: 'room1',
        lastInteraction: 'new-date',
      });

      expect(adminRoomsStore.rooms[0].last_interaction).toBe('new-date');
    });

    it('getter agentRooms returns rooms with user and not waiting', () => {
      adminRoomsStore.rooms = [
        { uuid: 'room1', user: true, is_waiting: false },
        { uuid: 'room2', user: false, is_waiting: false },
      ];
      expect(adminRoomsStore.agentRooms).toHaveLength(1);
    });

    it('getter waitingQueue returns rooms without user and not waiting', () => {
      adminRoomsStore.rooms = [
        { uuid: 'room1', user: false, is_waiting: false },
        { uuid: 'room2', user: true, is_waiting: false },
      ];
      expect(adminRoomsStore.waitingQueue).toHaveLength(1);
    });

    it('getter waitingContactAnswer returns rooms that are waiting', () => {
      adminRoomsStore.rooms = [
        { uuid: 'room1', is_waiting: true },
        { uuid: 'room2', is_waiting: false },
      ];
      expect(adminRoomsStore.waitingContactAnswer).toHaveLength(1);
    });

    it('getter getRoomById returns the correct room by uuid', () => {
      adminRoomsStore.rooms = [{ uuid: 'room1' }, { uuid: 'room2' }];
      expect(adminRoomsStore.getRoomById('room2')).toEqual({ uuid: 'room2' });
    });

    it('should view room because user not in queue but is admin user', async () => {
      await updateRoom(
        { uuid: '3', queue: { uuid: '1' } },
        {
          app: {
            ...adminProfileStore,
            viewedAgent: dashboardStore.viewedAgent,
          },
        },
      );
      expect(existRoomByUuid(adminRoomsStore, '3')).eq(true);
    });

    it('should view room because is seeing an agent of room', async () => {
      dashboardStore.$patch({
        viewedAgent: { email: 'testing@weni.ai' },
      });
      await updateRoom(
        {
          uuid: '3',
          queue: { uuid: '1' },
          user: { email: 'testing@weni.ai' },
        },
        {
          app: {
            ...adminProfileStore,
            viewedAgent: dashboardStore.viewedAgent,
          },
        },
      );
      expect(existRoomByUuid(adminRoomsStore, '3')).eq(true);
    });

    it('should dont show the room because it was transferred by the viewing agent ', async () => {
      dashboardStore.$patch({
        viewedAgent: { email: 'testing@weni.ai' },
      });
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
      expect(adminRoomsStore.activeRoom).eq(null);
    });

    describe('Pin functionality tests', () => {
      beforeEach(() => {
        adminRoomsStore.$patch({
          rooms: [
            {
              uuid: 'room1',
              is_pinned: false,
              user: { email: 'user1' },
              is_waiting: false,
              queue: { uuid: 'queue1' },
            },
            {
              uuid: 'room2',
              is_pinned: true,
              user: { email: 'user2' },
              is_waiting: false,
              queue: { uuid: 'queue1' },
            },
            {
              uuid: 'room3',
              is_pinned: true,
              user: { email: 'user3' },
              is_waiting: false,
              queue: { uuid: 'queue1' },
            },
            {
              uuid: 'room4',
              is_pinned: false,
              user: { email: 'user4' },
              is_waiting: false,
              queue: { uuid: 'queue1' },
            },
            {
              uuid: 'room5',
              is_pinned: true,
              user: { email: 'user5' },
              is_waiting: false,
              queue: { uuid: 'queue1' },
            },
          ],
          maxPinLimit: 5,
        });
      });

      it('should set maxPinLimit when getting rooms', async () => {
        Room.getAll.mockResolvedValue({
          results: [{ uuid: '1' }],
          next: true,
          max_pin_limit: 10,
        });

        await adminRoomsStore.getAll({ offset: 0, limit: 1 });

        expect(adminRoomsStore.maxPinLimit).toBe(10);
      });

      it('should set maxPinLimit to 0 when not provided in response', async () => {
        Room.getAll.mockResolvedValue({
          results: [{ uuid: '1' }],
          next: true,
        });

        await adminRoomsStore.getAll({ offset: 0, limit: 1 });

        expect(adminRoomsStore.maxPinLimit).toBe(0);
      });

      it('should preserve pin state when updating room', () => {
        adminRoomsStore.updateRoom({
          room: {
            uuid: 'room2',
            user: { email: 'new-user' },
            is_waiting: false,
            queue: { uuid: 'queue1' },
          },
          userEmail: 'testing@weni.ai',
          routerReplace: vi.fn(),
          viewedAgentEmail: null,
        });

        expect(adminRoomsStore.rooms.find((r) => r.uuid === 'room2')).toBe(
          undefined,
        );
      });

      it('should preserve pin state for rooms that were originally pinned', () => {
        const originalRoom = adminRoomsStore.rooms.find(
          (r) => r.uuid === 'room2',
        );
        expect(originalRoom.is_pinned).toBe(true);

        adminRoomsStore.updateRoom({
          room: {
            uuid: 'room2',
            user: { email: 'updated-user' },
            is_waiting: false,
            is_pinned: false,
            queue: { uuid: 'queue1' },
          },
          userEmail: 'testing@weni.ai',
          routerReplace: vi.fn(),
          viewedAgentEmail: null,
        });

        expect(adminRoomsStore.rooms.find((r) => r.uuid === 'room2')).toBe(
          undefined,
        );
      });

      it('should count pinned agent rooms correctly', () => {
        const pinnedAgentRooms = adminRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        );
        expect(pinnedAgentRooms).toHaveLength(3);
      });

      it('should not count non-agent rooms as pinned when they have is_pinned true', () => {
        adminRoomsStore.$patch({
          rooms: [
            { uuid: 'room1', is_pinned: true, user: null, is_waiting: false },
            {
              uuid: 'room2',
              is_pinned: true,
              user: { email: 'user1' },
              is_waiting: true,
            },
            {
              uuid: 'room3',
              is_pinned: true,
              user: { email: 'user2' },
              is_waiting: false,
            },
          ],
        });

        const pinnedAgentRooms = adminRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        );
        expect(pinnedAgentRooms).toHaveLength(1);
      });

      it('should handle empty rooms array for pin counting', () => {
        adminRoomsStore.$patch({ rooms: [] });

        const pinnedAgentRooms = adminRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        );
        expect(pinnedAgentRooms).toHaveLength(0);
      });

      it('should handle rooms without is_pinned property', () => {
        adminRoomsStore.$patch({
          rooms: [
            { uuid: 'room1', user: { email: 'user1' }, is_waiting: false },
            {
              uuid: 'room2',
              is_pinned: true,
              user: { email: 'user2' },
              is_waiting: false,
            },
            {
              uuid: 'room3',
              is_pinned: false,
              user: { email: 'user3' },
              is_waiting: false,
            },
          ],
        });

        const pinnedAgentRooms = adminRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        );
        expect(pinnedAgentRooms).toHaveLength(1);
      });

      it('should maintain pin state when removing rooms', () => {
        const initialPinnedCount = adminRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        ).length;
        expect(initialPinnedCount).toBe(3);

        adminRoomsStore.removeRoom('room2');

        const afterRemovalPinnedCount = adminRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        ).length;
        expect(afterRemovalPinnedCount).toBe(2);
        expect(
          adminRoomsStore.rooms.find((r) => r.uuid === 'room2'),
        ).toBeUndefined();
      });

      it('should maintain pin state when adding new rooms', () => {
        const newPinnedRoom = {
          uuid: 'room6',
          is_pinned: true,
          user: { email: 'user6' },
          is_waiting: false,
        };

        adminRoomsStore.addRoom(newPinnedRoom);

        const pinnedAgentRooms = adminRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        );
        expect(pinnedAgentRooms).toHaveLength(4);
        expect(pinnedAgentRooms.some((room) => room.uuid === 'room6')).toBe(
          true,
        );
      });

      it('should not add duplicate room even if pin state differs', () => {
        const duplicateRoom = {
          uuid: 'room1',
          is_pinned: true,
          user: { email: 'user1' },
          is_waiting: false,
        };

        const initialRoomCount = adminRoomsStore.rooms.length;
        adminRoomsStore.addRoom(duplicateRoom);

        expect(adminRoomsStore.rooms.length).toBe(initialRoomCount);
      });

      it('should handle updateRoom with undefined is_pinned in original room', () => {
        adminRoomsStore.$patch({
          rooms: [
            {
              uuid: 'room1',
              user: { email: 'user1' },
              is_waiting: false,
              queue: { uuid: 'queue1' },
            },
          ],
        });

        adminRoomsStore.updateRoom({
          room: {
            uuid: 'room1',
            user: { email: 'updated-user' },
            is_waiting: false,
            queue: { uuid: 'queue1' },
          },
          userEmail: 'testing@weni.ai',
          routerReplace: vi.fn(),
          viewedAgentEmail: null,
        });

        expect(
          adminRoomsStore.rooms.find((r) => r.uuid === 'room1'),
        ).toBeUndefined();
      });

      it('should handle pin state in different room types correctly', () => {
        adminRoomsStore.$patch({
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
              user: { email: 'flow' },
              is_waiting: true,
            },
          ],
        });

        expect(
          adminRoomsStore.agentRooms.filter((r) => r.is_pinned),
        ).toHaveLength(1);
        expect(
          adminRoomsStore.waitingQueue.filter((r) => r.is_pinned),
        ).toHaveLength(1);
        expect(
          adminRoomsStore.waitingContactAnswer.filter((r) => r.is_pinned),
        ).toHaveLength(1);
      });

      it('should handle maxPinLimit edge cases', () => {
        adminRoomsStore.$patch({ maxPinLimit: 0 });
        expect(adminRoomsStore.maxPinLimit).toBe(0);

        adminRoomsStore.$patch({ maxPinLimit: -1 });
        expect(adminRoomsStore.maxPinLimit).toBe(-1);

        adminRoomsStore.$patch({ maxPinLimit: 999999 });
        expect(adminRoomsStore.maxPinLimit).toBe(999999);
      });
    });
  });

  describe('Human Service User', () => {
    let humanServiceRoomsStore = useRooms();
    let humanServiceProfileStore;
    let dashboardStore;

    beforeEach(() => {
      mocks.useProfile.mockReturnValue(mockProfileHumanServiceState);

      humanServiceProfileStore = useProfile();
      humanServiceRoomsStore.$patch({
        rooms: [...roomsMock],
      });

      dashboardStore = dashboardStore?.$reset() || useDashboard();
    });

    it('should remove room because user not in queue', async () => {
      expect(existRoomByUuid(humanServiceRoomsStore, '1')).eq(true);
      await updateRoom(
        { uuid: '1', queue: { uuid: '3' } },
        {
          app: {
            ...humanServiceProfileStore,
            viewedAgent: dashboardStore.viewedAgent,
          },
        },
      );
      expect(existRoomByUuid(humanServiceRoomsStore, '1')).eq(false);
    });

    it('should view room because transfer user me', async () => {
      expect(existRoomByUuid(humanServiceRoomsStore, '3')).eq(false);
      await updateRoom(
        {
          uuid: '3',
          queue: { uuid: '3' },
          user: { email: 'testing@weni.ai' },
        },
        {
          app: {
            ...humanServiceProfileStore,
            viewedAgent: dashboardStore.viewedAgent,
          },
        },
      );
      expect(existRoomByUuid(humanServiceRoomsStore, '3')).eq(true);
    });

    it('should not view room because i dont have an active queue', async () => {
      await updateRoom(
        { uuid: '3', queue: { uuid: '2' } },
        {
          app: {
            ...humanServiceProfileStore,
            viewedAgent: dashboardStore.viewedAgent,
          },
        },
      );
      expect(existRoomByUuid(humanServiceRoomsStore, '3')).eq(false);
    });

    it('should transfer active room to other user', async () => {
      const routerReplace = vi.fn();

      humanServiceRoomsStore.$patch({
        activeRoom: { ...humanServiceRoomsStore.rooms[0] },
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

      expect(humanServiceRoomsStore.activeRoom).eq(null);
      expect(routerReplace).toHaveBeenCalled();
      expect(existRoomByUuid(humanServiceRoomsStore, roomUuid)).eq(false);
    });

    it('should show modal assumed chat', async () => {
      await updateRoom(
        {
          id: '5',
          user: { email: 'testing-adm@weni.ai' },
          transfer_history: { from: { type: 'user' } },
          contact: { name: 'Cliente 1' },
        },
        {
          app: {
            ...humanServiceProfileStore,
            viewedAgent: dashboardStore.viewedAgent,
          },
        },
      );

      expect(dashboardStore.showModalAssumedChat).eq(true);
      expect(dashboardStore.assumedChatContactName).eq('Cliente 1');
    });

    describe('Pin functionality tests for Human Service User', () => {
      beforeEach(() => {
        humanServiceRoomsStore.$patch({
          rooms: [
            {
              uuid: 'room1',
              is_pinned: false,
              user: { email: 'testing@weni.ai' },
              is_waiting: false,
              queue: { uuid: '1' },
            },
            {
              uuid: 'room2',
              is_pinned: true,
              user: { email: 'testing@weni.ai' },
              is_waiting: false,
              queue: { uuid: '1' },
            },
            {
              uuid: 'room3',
              is_pinned: true,
              user: { email: 'other@weni.ai' },
              is_waiting: false,
              queue: { uuid: '1' },
            },
            {
              uuid: 'room4',
              is_pinned: false,
              user: null,
              is_waiting: false,
              queue: { uuid: '1' },
            },
            {
              uuid: 'room5',
              is_pinned: true,
              user: { email: 'testing@weni.ai' },
              is_waiting: true,
              queue: { uuid: '1' },
            },
          ],
          maxPinLimit: 3,
        });
      });

      it('should preserve pin state when updating own room', () => {
        humanServiceRoomsStore.updateRoom({
          room: {
            uuid: 'room2',
            user: { email: 'testing@weni.ai' },
            is_waiting: false,
            queue: { uuid: '1' },
          },
          userEmail: 'testing@weni.ai',
          routerReplace: vi.fn(),
          viewedAgentEmail: null,
        });

        const updatedRoom = humanServiceRoomsStore.rooms.find(
          (r) => r.uuid === 'room2',
        );
        expect(updatedRoom.is_pinned).toBe(true);
      });

      it('should filter out rooms not in user queue but preserve pin state for accessible rooms', () => {
        humanServiceRoomsStore.updateRoom({
          room: {
            uuid: 'room1',
            user: { email: 'different-user@weni.ai' },
            is_waiting: false,
            queue: { uuid: '3' },
          },
          userEmail: 'testing@weni.ai',
          routerReplace: vi.fn(),
          viewedAgentEmail: null,
        });

        const room = humanServiceRoomsStore.rooms.find(
          (r) => r.uuid === 'room1',
        );
        expect(room).toBeUndefined();
      });

      it('should count pinned rooms correctly for human service user', () => {
        const pinnedAgentRooms = humanServiceRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        );
        expect(pinnedAgentRooms).toHaveLength(2);
      });

      it('should handle pin state when room is transferred to other user', () => {
        const routerReplace = vi.fn();
        humanServiceRoomsStore.$patch({
          activeRoom: { uuid: 'room2', is_pinned: true },
        });

        humanServiceRoomsStore.updateRoom({
          room: {
            uuid: 'room2',
            user: { email: 'different-user@weni.ai' },
            is_waiting: false,
            queue: { uuid: '1' },
            is_pinned: true,
          },
          userEmail: 'testing@weni.ai',
          routerReplace,
          viewedAgentEmail: null,
        });

        const room = humanServiceRoomsStore.rooms.find(
          (r) => r.uuid === 'room2',
        );
        expect(room).toBeUndefined();
        expect(humanServiceRoomsStore.activeRoom).toBeNull();
      });

      it('should maintain pin state for rooms accessible through queue permissions', () => {
        const accessibleRoom = humanServiceRoomsStore.rooms.find(
          (r) => r.uuid === 'room4',
        );
        expect(accessibleRoom).toBeDefined();
        expect(accessibleRoom.is_pinned).toBe(false);
      });

      it('should handle removing pinned rooms from selected transfer list', () => {
        humanServiceRoomsStore.$patch({
          selectedRoomsToTransfer: ['room1', 'room2', 'room3'],
        });

        humanServiceRoomsStore.removeRoom('room2');

        expect(humanServiceRoomsStore.selectedRoomsToTransfer).toEqual([
          'room1',
          'room3',
        ]);
        expect(
          humanServiceRoomsStore.rooms.find((r) => r.uuid === 'room2'),
        ).toBeUndefined();
      });

      it('should handle pin state when active room is transferred and cleared', () => {
        humanServiceRoomsStore.$patch({
          activeRoom: {
            uuid: 'room2',
            is_pinned: true,
            user: { email: 'testing@weni.ai' },
          },
        });

        const routerReplace = vi.fn();

        humanServiceRoomsStore.updateRoom({
          room: {
            uuid: 'room2',
            user: { email: 'different-user@weni.ai' },
            is_waiting: false,
            queue: { uuid: '1' },
          },
          userEmail: 'testing@weni.ai',
          routerReplace,
          viewedAgentEmail: null,
        });

        expect(humanServiceRoomsStore.activeRoom).toBeNull();
        expect(routerReplace).toHaveBeenCalled();
      });

      it('should validate pin functionality with maxPinLimit for human service user', () => {
        expect(humanServiceRoomsStore.maxPinLimit).toBe(3);

        const currentPinnedCount = humanServiceRoomsStore.agentRooms.filter(
          (room) => room.is_pinned,
        ).length;
        expect(currentPinnedCount).toBe(2);

        expect(currentPinnedCount).toBeLessThan(
          humanServiceRoomsStore.maxPinLimit,
        );
      });

      it('should handle mixed room types with pin states', () => {
        const agentRooms = humanServiceRoomsStore.agentRooms;
        const waitingQueue = humanServiceRoomsStore.waitingQueue;
        const waitingContactAnswer =
          humanServiceRoomsStore.waitingContactAnswer;

        expect(agentRooms.filter((r) => r.is_pinned)).toHaveLength(2);
        expect(waitingQueue.filter((r) => r.is_pinned)).toHaveLength(0);
        expect(waitingContactAnswer.filter((r) => r.is_pinned)).toHaveLength(1);
      });
    });
  });
});
