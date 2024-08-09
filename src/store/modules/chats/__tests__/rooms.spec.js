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

const app = createApp({});
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);

const mocks = vi.hoisted(() => {
  return {
    useProfile: vi.fn(),
  };
});

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
