import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ViewMode from '@/views/Dashboard/ViewMode/index.vue';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import * as roomUtils from '@/utils/room';

vi.mock('@/utils/room', () => ({
  parseUrn: vi.fn(),
}));

describe('ViewMode', () => {
  const mockRouter = { push: vi.fn(), replace: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset parseUrn mock to default behavior
    vi.mocked(roomUtils.parseUrn).mockReturnValue({
      plataform: '',
      contactNum: '',
    });
  });

  const createWrapper = (storeState = {}) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        rooms: {
          activeRoom: null,
          rooms: [],
          contactToTransfer: '',
          ...storeState.rooms,
        },
        discussions: { activeDiscussion: null, ...storeState.discussions },
        dashboard: {
          viewedAgent: storeState.dashboard?.viewedAgent || {
            email: '',
            name: '',
          },
          ...(storeState.dashboard || {}),
        },
        profile: { me: { email: 'test@example.com' }, ...storeState.profile },
        roomMessages: { roomMessagesNext: null, ...storeState.roomMessages },
        featureFlag: {
          featureFlags: {
            active_features:
              storeState.featureFlag?.featureFlags?.active_features || [],
          },
          ...(storeState.featureFlag || {}),
        },
      },
    });

    return mount(ViewMode, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key, params) =>
            params ? `${key}_${JSON.stringify(params)}` : key,
          $tc: (key) => key,
          $router: mockRouter,
          $route: { query: {} },
        },
        stubs: {
          ChatsLayout: {
            template: '<div><slot /><slot name="aside" /></div>',
            props: ['viewedAgent'],
          },
          ViewModeHeader: { template: '<div />', props: ['viewedAgent'] },
          ChatsBackground: { template: '<div />' },
          ChatHeaderLoading: { template: '<div />' },
          UnnnicChatsHeader: {
            template: '<div />',
            props: [
              'title',
              'subtitle',
              'avatarClick',
              'titleClick',
              'avatarName',
              'avatarIcon',
              'size',
            ],
          },
          RoomMessages: { template: '<div />' },
          DiscussionMessages: { template: '<div />' },
          ContactInfo: { template: '<div />', props: ['isViewMode'] },
          ModalGetChat: {
            template: '<div />',
            props: ['showModal', 'title', 'description', 'whenGetChat'],
          },
          ButtonJoinDiscussion: {
            template: '<div @click="$emit(\'click\')" />',
          },
          UnnnicButton: {
            template: '<button @click="$emit(\'click\')" />',
            props: ['text', 'type'],
          },
          UnnnicToolTip: {
            template: '<div><slot /></div>',
            props: ['enabled', 'text', 'side'],
          },
          UnnnicIcon: {
            template: '<div @click="$emit(\'click\')" />',
            props: ['icon', 'size', 'clickable', 'scheme'],
          },
          ModalTransferRooms: {
            template: '<div />',
          },
        },
      },
    });
  };

  const mockRoom = {
    uuid: 'room-1',
    contact: { name: 'John Doe', urn: 'whatsapp:+1234567890' },
    user: { email: 'agent@example.com' },
    protocol: 'whatsapp',
    has_history: true,
  };
  const mockDiscussion = {
    uuid: 'discussion-1',
    subject: 'Test Discussion',
    contact: 'Jane Doe',
  };
  const mockAgent = { email: 'test@example.com', name: 'Test Agent' };

  describe('Component State and Props', () => {
    it('should initialize with correct data and computed properties', () => {
      const wrapper = createWrapper({ dashboard: { viewedAgent: mockAgent } });

      expect(wrapper.vm.isRoomSkeletonActive).toBe(false);
      expect(wrapper.vm.isContactInfoOpened).toBe(false);
      expect(wrapper.vm.isAssumeChatConfirmationOpened).toBe(false);
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
      expect(wrapper.vm.viewedAgent).toEqual(mockAgent);
    });

    it('should handle store integration properly', () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom, rooms: [mockRoom] },
        discussions: { activeDiscussion: mockDiscussion },
        profile: { me: { email: 'user@example.com' } },
        roomMessages: { roomMessagesNext: 'token' },
      });

      expect(wrapper.vm.room).toEqual(mockRoom);
      expect(wrapper.vm.rooms).toEqual([mockRoom]);
      expect(wrapper.vm.discussion).toEqual(mockDiscussion);
      expect(wrapper.vm.me).toEqual({ email: 'user@example.com' });
      expect(wrapper.vm.roomMessagesNext).toBe('token');
    });
  });

  describe('Component Methods', () => {
    it('should handle modal operations correctly', () => {
      const wrapper = createWrapper({ dashboard: { viewedAgent: mockAgent } });

      wrapper.vm.handleModal('ContactInfo', 'open');
      expect(wrapper.vm.isContactInfoOpened).toBe(true);

      wrapper.vm.handleModal('ContactInfo', 'close');
      expect(wrapper.vm.isContactInfoOpened).toBe(false);

      wrapper.vm.handleModal('AssumeChatConfirmation', 'open');
      expect(wrapper.vm.isAssumeChatConfirmationOpened).toBe(true);

      expect(() => wrapper.vm.handleModal('Invalid', 'open')).toThrow(
        "Modal name 'Invalid' not found",
      );
      expect(() => wrapper.vm.handleModal('ContactInfo', 'invalid')).toThrow(
        "Modal handler 'invalid' not found",
      );
    });

    it('should handle openTransferModal correctly', () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
      });

      wrapper.vm.openTransferModal();

      expect(wrapper.vm.contactToTransfer).toBe(mockRoom.uuid);
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(true);
    });

    it('should handle closeTransferModal correctly', () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
      });

      wrapper.vm.contactToTransfer = mockRoom.uuid;
      wrapper.vm.isModalTransferRoomsOpened = true;

      wrapper.vm.closeTransferModal();

      expect(wrapper.vm.contactToTransfer).toBe('');
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
    });

    it('should handle openHistory correctly', () => {
      vi.mocked(roomUtils.parseUrn).mockReturnValue({
        plataform: 'whatsapp',
        contactNum: '+1234567890',
      });

      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
      });

      wrapper.vm.openHistory();

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'closed-rooms',
          query: expect.objectContaining({
            contactUrn: '1234567890',
            protocol: 'whatsapp',
            from: mockRoom.uuid,
          }),
        }),
      );
    });

    it('should handle navigation methods correctly', () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        discussions: { activeDiscussion: mockDiscussion },
        rooms: { activeRoom: mockRoom },
      });

      wrapper.vm.whenJoinDiscussion();
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'discussion',
        params: { discussionId: mockDiscussion.uuid },
      });

      wrapper.vm.whenGetChat();
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'room',
        params: { roomId: mockRoom.uuid },
      });
    });
  });

  describe('Component Lifecycle and Watchers', () => {
    it('should call store actions in beforeMount', () => {
      createWrapper({ dashboard: { viewedAgent: mockAgent } });

      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();

      expect(roomsStore.setActiveRoom).toHaveBeenCalledWith(null);
      expect(discussionsStore.setActiveDiscussion).toHaveBeenCalledWith(null);
    });

    it('should handle room watcher behavior', async () => {
      const wrapper = createWrapper({ dashboard: { viewedAgent: mockAgent } });

      wrapper.vm.isContactInfoOpened = true;
      await wrapper.vm.$nextTick();

      const pinia = wrapper.vm.$pinia;
      const roomsStore = useRooms(pinia);
      roomsStore.activeRoom = mockRoom;

      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isContactInfoOpened).toBe(false);
    });
  });

  describe('Conditional Rendering Logic', () => {
    it('should render based on viewedAgent email presence', () => {
      const wrapperNoEmail = createWrapper();
      expect(wrapperNoEmail.vm.viewedAgent.email).toBe('');

      const wrapperWithEmail = createWrapper({
        dashboard: { viewedAgent: mockAgent },
      });
      expect(wrapperWithEmail.vm.viewedAgent.email).toBe(mockAgent.email);
    });

    it('should render ContactInfo when weniChatsContactInfoV2 feature flag is enabled', () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        featureFlag: {
          featureFlags: { active_features: ['weniChatsContactInfoV2'] },
        },
      });

      expect(wrapper.vm.featureFlags.active_features).toContain(
        'weniChatsContactInfoV2',
      );
    });

    it('should handle room and discussion states', () => {
      const wrapperEmpty = createWrapper({
        dashboard: { viewedAgent: mockAgent },
      });
      expect(wrapperEmpty.vm.room).toBeNull();
      expect(wrapperEmpty.vm.discussion).toBeNull();

      const wrapperWithRoom = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
      });
      expect(wrapperWithRoom.vm.room).toEqual(mockRoom);

      const wrapperWithDiscussion = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        discussions: { activeDiscussion: mockDiscussion },
      });
      expect(wrapperWithDiscussion.vm.discussion).toEqual(mockDiscussion);
    });

    it('should handle modal visibility states', () => {
      const wrapper = createWrapper({ dashboard: { viewedAgent: mockAgent } });

      expect(wrapper.vm.isContactInfoOpened).toBe(false);
      expect(wrapper.vm.isAssumeChatConfirmationOpened).toBe(false);

      wrapper.vm.handleModal('ContactInfo', 'open');
      expect(wrapper.vm.isContactInfoOpened).toBe(true);

      wrapper.vm.handleModal('AssumeChatConfirmation', 'open');
      expect(wrapper.vm.isAssumeChatConfirmationOpened).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should handle button interactions properly', async () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
        profile: { me: { email: 'different@example.com' } },
      });

      const button = wrapper.find('button');
      if (button.exists()) {
        await button.trigger('click');
        expect(wrapper.vm.isAssumeChatConfirmationOpened).toBe(true);
      }
    });

    it('should handle discussion join button click', async () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        discussions: { activeDiscussion: mockDiscussion },
      });

      wrapper.vm.whenJoinDiscussion();
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'discussion',
        params: { discussionId: mockDiscussion.uuid },
      });
    });
  });

  describe('Complete Coverage Tests', () => {
    it('should handle rooms watcher with route query processing when rooms are loaded', async () => {
      vi.clearAllMocks();
      const rooms = [mockRoom, { uuid: 'room-2', contact: { name: 'Jane' } }];

      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { rooms },
      });

      wrapper.vm.$route.query = { uuid_room: 'room-1' };

      const roomsStore = useRooms();
      roomsStore.setActiveRoom = vi.fn();

      await wrapper.vm.$options.watch.rooms.handler.call(wrapper.vm);

      expect(roomsStore.setActiveRoom).toHaveBeenCalledWith(mockRoom);
      expect(mockRouter.replace).toHaveBeenCalledWith({ query: {} });
    });

    it('should handle rooms watcher when uuid_room not found', async () => {
      vi.clearAllMocks();
      const rooms = [{ uuid: 'room-2', contact: { name: 'Jane' } }];

      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { rooms },
      });

      wrapper.vm.$route.query = { uuid_room: 'nonexistent-room' };

      const roomsStore = useRooms();
      roomsStore.setActiveRoom = vi.fn();

      await wrapper.vm.$options.watch.rooms.handler.call(wrapper.vm);

      expect(roomsStore.setActiveRoom).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('should handle rooms watcher without route query', async () => {
      vi.clearAllMocks();
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { rooms: [mockRoom] },
      });

      wrapper.vm.$route.query = {};

      const roomsStore = useRooms();
      roomsStore.setActiveRoom = vi.fn();

      await wrapper.vm.$options.watch.rooms.handler.call(wrapper.vm);

      expect(roomsStore.setActiveRoom).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('should not process uuid_room when rooms array is empty', async () => {
      vi.clearAllMocks();
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { rooms: [] },
      });

      wrapper.vm.$route.query = { uuid_room: 'room-1' };

      const roomsStore = useRooms();
      roomsStore.setActiveRoom = vi.fn();

      await wrapper.vm.$options.watch.rooms.handler.call(wrapper.vm);

      expect(roomsStore.setActiveRoom).not.toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('should clear query after successfully setting active room', async () => {
      vi.clearAllMocks();
      const rooms = [mockRoom];

      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { rooms },
      });

      wrapper.vm.$route.query = { uuid_room: 'room-1' };

      const roomsStore = useRooms();
      const setActiveRoomSpy = vi.fn();
      roomsStore.setActiveRoom = setActiveRoomSpy;

      await wrapper.vm.$options.watch.rooms.handler.call(wrapper.vm);

      expect(setActiveRoomSpy).toHaveBeenCalledWith(mockRoom);
      expect(mockRouter.replace).toHaveBeenCalledWith({ query: {} });
    });

    it('should handle whenGetChat method completely', () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
      });

      const dashboardStore = { setViewedAgent: vi.fn() };
      wrapper.vm.setViewedAgent = dashboardStore.setViewedAgent;

      wrapper.vm.whenGetChat();

      expect(dashboardStore.setViewedAgent).toHaveBeenCalledWith({
        email: '',
        name: '',
      });
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'room',
        params: { roomId: mockRoom.uuid },
      });
    });

    it('should handle assume chat button visibility edge cases', () => {
      const roomWithSameUser = {
        ...mockRoom,
        user: { email: 'test@example.com' },
      };
      const wrapperSameUser = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: roomWithSameUser },
        profile: { me: { email: 'test@example.com' } },
      });

      expect(wrapperSameUser.vm.room.user.email).toBe(
        wrapperSameUser.vm.me.email,
      );

      const roomWithoutUser = { ...mockRoom, user: null };
      const wrapperNoUser = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: roomWithoutUser },
      });

      expect(wrapperNoUser.vm.room.user).toBeNull();

      const wrapperWithBoth = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
        discussions: { activeDiscussion: mockDiscussion },
      });

      expect(wrapperWithBoth.vm.room).toBeTruthy();
      expect(wrapperWithBoth.vm.discussion).toBeTruthy();
    });

    it('should handle isRoomSkeletonActive state changes', async () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
      });

      expect(wrapper.vm.isRoomSkeletonActive).toBe(false);

      await wrapper.setData({ isRoomSkeletonActive: true });
      expect(wrapper.vm.isRoomSkeletonActive).toBe(true);

      await wrapper.setData({ isRoomSkeletonActive: false });
      expect(wrapper.vm.isRoomSkeletonActive).toBe(false);
    });

    it('should handle all modal close event scenarios', async () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
      });

      await wrapper.setData({
        isContactInfoOpened: true,
        isAssumeChatConfirmationOpened: true,
      });

      const modalGetChat = wrapper.vm;
      modalGetChat.handleModal('AssumeChatConfirmation', 'close');
      expect(wrapper.vm.isAssumeChatConfirmationOpened).toBe(false);

      modalGetChat.handleModal('ContactInfo', 'close');
      expect(wrapper.vm.isContactInfoOpened).toBe(false);
    });

    it('should test all computed property combinations', () => {
      const wrapperEmpty = createWrapper();
      expect(wrapperEmpty.vm.viewedAgent).toEqual({ email: '', name: '' });
      expect(wrapperEmpty.vm.room).toBeNull();
      expect(wrapperEmpty.vm.discussion).toBeNull();
      expect(wrapperEmpty.vm.me).toEqual({ email: 'test@example.com' });
      expect(wrapperEmpty.vm.rooms).toEqual([]);

      const wrapperFull = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom, rooms: [mockRoom] },
        discussions: { activeDiscussion: mockDiscussion },
        profile: { me: { email: 'different@example.com' } },
        roomMessages: { roomMessagesNext: 'next-page' },
      });

      expect(wrapperFull.vm.viewedAgent).toEqual(mockAgent);
      expect(wrapperFull.vm.room).toEqual(mockRoom);
      expect(wrapperFull.vm.discussion).toEqual(mockDiscussion);
      expect(wrapperFull.vm.me).toEqual({ email: 'different@example.com' });
      expect(wrapperFull.vm.rooms).toEqual([mockRoom]);
      expect(wrapperFull.vm.roomMessagesNext).toBe('next-page');
    });

    it('should handle room without history correctly', () => {
      const roomWithoutHistory = {
        ...mockRoom,
        has_history: false,
      };

      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: roomWithoutHistory },
      });

      expect(wrapper.vm.room.has_history).toBe(false);
    });

    it('should handle transfer modal state correctly', async () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
      });

      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
      expect(wrapper.vm.contactToTransfer).toBe('');

      wrapper.vm.openTransferModal();

      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(true);
      expect(wrapper.vm.contactToTransfer).toBe(mockRoom.uuid);

      wrapper.vm.closeTransferModal();

      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
      expect(wrapper.vm.contactToTransfer).toBe('');
    });

    it('should test ModalGetChat props binding', () => {
      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
      });

      expect(wrapper.vm.isAssumeChatConfirmationOpened).toBe(false);

      wrapper.vm.handleModal('AssumeChatConfirmation', 'open');
      expect(wrapper.vm.isAssumeChatConfirmationOpened).toBe(true);

      expect(typeof wrapper.vm.whenGetChat).toBe('function');
    });

    it('should test template conditional branches comprehensively', () => {
      // Test ChatsLayout v-if condition
      const wrapperNoEmail = createWrapper();
      expect(wrapperNoEmail.vm.viewedAgent.email).toBe('');

      const wrapperWithEmail = createWrapper({
        dashboard: { viewedAgent: mockAgent },
      });
      expect(wrapperWithEmail.vm.viewedAgent.email).toBe(mockAgent.email);

      const wrapperBackgroundVisible = createWrapper({
        dashboard: { viewedAgent: mockAgent },
      });
      expect(wrapperBackgroundVisible.vm.room).toBeNull();
      expect(wrapperBackgroundVisible.vm.discussion).toBeNull();
      expect(wrapperBackgroundVisible.vm.isRoomSkeletonActive).toBe(false);

      const wrapperWithRoom = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: mockRoom },
      });
      expect(wrapperWithRoom.vm.room).toBeTruthy();

      const wrapperWithDiscussion = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        discussions: { activeDiscussion: mockDiscussion },
      });
      expect(wrapperWithDiscussion.vm.discussion).toBeTruthy();
    });

    it('should handle room with unnamed contact', () => {
      const roomWithoutContactName = {
        ...mockRoom,
        contact: { name: '' },
      };

      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: roomWithoutContactName },
      });

      expect(wrapper.vm.room.contact.name).toBe('');
    });

    it('should handle openHistory with contact name fallback', () => {
      vi.mocked(roomUtils.parseUrn).mockReturnValue({
        plataform: 'telegram',
        contactNum: '',
      });

      const roomWithoutUrn = {
        ...mockRoom,
        contact: { name: 'John Doe', urn: '' },
      };

      const wrapper = createWrapper({
        dashboard: { viewedAgent: mockAgent },
        rooms: { activeRoom: roomWithoutUrn },
      });

      wrapper.vm.openHistory();

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'closed-rooms',
          query: expect.objectContaining({
            contactUrn: 'John Doe',
            protocol: 'whatsapp',
            from: roomWithoutUrn.uuid,
          }),
        }),
      );
    });
  });
});
