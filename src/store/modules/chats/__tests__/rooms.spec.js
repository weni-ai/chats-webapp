import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApp } from 'vue';
import { setActivePinia, createPinia } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';

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
  const findRoomByUuid = (roomsStore, uuid) => {
    return !!roomsStore.rooms.find((room) => room.uuid === uuid);
  };

  describe('Admin User', () => {
    let adminRoomsStore = useRooms();
    let adminProfileStore;
    let viewedAgent;

    beforeEach(() => {
      mocks.useProfile.mockReturnValue(mockProfileAdminState);

      adminProfileStore = JSON.parse(JSON.stringify(useProfile()));
      adminRoomsStore.$patch({
        rooms: JSON.parse(JSON.stringify(roomsMock)),
      });
      viewedAgent = { name: '', email: '' };
    });

    it('should view room because user not in queue but is admin user', async () => {
      await updateRoom(
        { uuid: '3', queue: { uuid: '1' } },
        { app: { ...adminProfileStore, viewedAgent } },
      );
      expect(findRoomByUuid(adminRoomsStore, '3')).eq(true);
    });
  });

  describe('Human Service User', () => {
    let humanServiceRoomsStore = useRooms();
    let humanServiceProfileStore;
    let viewedAgent;

    beforeEach(() => {
      mocks.useProfile.mockReturnValue(mockProfileHumanServiceState);

      humanServiceProfileStore = useProfile();
      humanServiceRoomsStore.$patch({
        rooms: JSON.parse(JSON.stringify(roomsMock)),
      });
      viewedAgent = { name: '', email: '' };
    });

    it('should remove room because user not in queue', async () => {
      expect(findRoomByUuid(humanServiceRoomsStore, '1')).eq(true);
      await updateRoom(
        { uuid: '1', queue: { uuid: '3' } },
        { app: { ...humanServiceProfileStore, viewedAgent } },
      );
      expect(findRoomByUuid(humanServiceRoomsStore, '1')).eq(false);
    });

    it('should view room because transfer user me', async () => {
      expect(findRoomByUuid(humanServiceRoomsStore, '3')).eq(false);
      await updateRoom(
        { uuid: '3', queue: { uuid: '3' }, user: { email: 'testing@weni.ai' } },
        { app: { ...humanServiceProfileStore, viewedAgent } },
      );
      expect(findRoomByUuid(humanServiceRoomsStore, '3')).eq(true);
    });

    it('should not view room because i dont have an active queue', async () => {
      await updateRoom(
        { uuid: '3', queue: { uuid: '2' } },
        { app: { ...humanServiceProfileStore, viewedAgent } },
      );
      expect(findRoomByUuid(humanServiceRoomsStore, '3')).eq(false);
    });
  });
});
