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
  });
});
