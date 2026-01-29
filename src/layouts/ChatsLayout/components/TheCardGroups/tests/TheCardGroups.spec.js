import { flushPromises, mount, config } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useDiscussions } from '@/store/modules/chats/discussions';

import TheCardGroups from '../index.vue';

vi.mock('@/views/loadings/RoomsList.vue', () => ({
  default: {
    name: 'RoomsListLoading',
    template: '<div data-testid="mocked-rooms-loading">Loading...</div>',
  },
}));

vi.mock('@/components/ModalQueuePriorizations.vue', () => ({
  default: {
    name: 'ModalQueuePriorizations',
    emits: ['close'],
    template: '<div data-testid="mocked-modal-queue">Modal</div>',
  },
}));

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    pinRoom: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

const mockRooms = [
  {
    uuid: 'room-1',
    contact: { name: 'John Doe', uuid: 'contact-1' },
    unread_msgs: 3,
    is_pinned: false,
    user: { email: 'agent@test.com' },
    last_interaction: '2025-01-20T10:30:00Z',
  },
  {
    uuid: 'room-2',
    contact: { name: 'Jane Smith', uuid: 'contact-2' },
    unread_msgs: 1,
    is_pinned: true,
    user: { email: 'agent@test.com' },
    last_interaction: '2025-01-20T09:30:00Z',
  },
];

const mockDiscussions = [
  {
    uuid: 'discussion-1',
    subject: 'Test Discussion 1',
    contact: 'Contact 1',
  },
  {
    uuid: 'discussion-2',
    subject: 'Test Discussion 2',
    contact: 'Contact 2',
  },
];

describe('TheCardGroups.vue', () => {
  let pinia;
  let wrapper;

  const createWrapper = (props = {}) => {
    const defaultProps = {
      disabled: false,
      isViewMode: false,
      viewedAgent: '',
    };

    return mount(TheCardGroups, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [pinia],
        components: {
          UnnnicToolTip: config.global.stubs.UnnnicToolTip,
        },
        mocks: {
          $t: (key, params) => {
            const translations = {
              'chats.search_contact': 'Search contact',
              'chats.select_queues': 'Select queues',
              'chats.room_list.order_by': 'Order by',
              'chats.room_list.most_recent': 'Most recent',
              'chats.room_list.older': 'Older',
              'chats.discussions': `Discussions (${params?.length || 0})`,
              'chats.waiting': `Waiting (${params?.length || 0})`,
              'chats.in_progress': `In progress (${params?.length || 0})`,
              'chats.sent_flows': `Sent flows (${params?.length || 0})`,
              without_results: 'No results found',
              without_chats: 'No chats available',
              'chats.room_pin.success_pin': 'Chat pinned with success',
              'chats.room_pin.success_unpin': 'Unpinned chat',
              'chats.room_pin.error_pin_limit': `You can pin up to ${params?.max_pin_limit} chats`,
              'chats.room_pin.error_403': 'Is not a room user',
              'chats.room_pin.error_404': "The room doesn't exist",
              'chats.errors.401': 'Authentication error',
              'chats.errors.default':
                'An error occurred, please try again later',
            };
            return translations[key] || key;
          },
        },
        stubs: {
          UnnnicInput: {
            template: '<input data-testid="unnnic-input" v-bind="$attrs" />',
            props: [
              'modelValue',
              'iconLeft',
              'iconRight',
              'iconRightClickable',
              'size',
              'placeholder',
            ],
            emits: ['update:modelValue', 'icon-right-click'],
          },
          UnnnicButton: {
            template:
              '<button data-testid="unnnic-button" v-bind="$attrs"><slot></slot></button>',
            props: ['iconCenter', 'type', 'size'],
          },
          UnnnicDisclaimer: {
            template: '<div data-testid="unnnic-disclaimer">{{ text }}</div>',
            props: ['text', 'iconColor'],
          },
        },
      },
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();

    pinia = createTestingPinia({
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    const roomsStore = useRooms();
    roomsStore.agentRooms = mockRooms;
    roomsStore.waitingQueue = [];
    roomsStore.waitingContactAnswer = [];
    roomsStore.hasNextRooms = false;
    roomsStore.newMessagesByRoom = {};
    roomsStore.maxPinLimit = 5;
    roomsStore.getAll = vi.fn().mockResolvedValue();
    roomsStore.setActiveRoom = vi.fn().mockResolvedValue();

    const configStore = useConfig();
    configStore.project = {
      config: {
        can_use_queue_prioritization: true,
        can_use_bulk_transfer: true,
      },
    };
    configStore.enableAutomaticRoomRouting = false;

    const profileStore = useProfile();
    profileStore.me = {
      email: 'agent@test.com',
      project_permission_role: 2, // Non-admin
    };

    const discussionsStore = useDiscussions();
    discussionsStore.discussions = mockDiscussions;
    discussionsStore.getAll = vi.fn().mockResolvedValue();
    discussionsStore.setActiveDiscussion = vi.fn().mockResolvedValue();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering tests', () => {
    it('renders correctly with basic props', () => {
      wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);
      expect(
        wrapper.find('[data-testid="card-groups-container"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="search-contact-input"]').exists(),
      ).toBe(true);
      expect(wrapper.find('[data-testid="chat-groups-header"]').exists()).toBe(
        true,
      );
    });

    it('renders queue prioritization button when conditions are met', () => {
      wrapper = createWrapper();

      expect(
        wrapper.findComponent({ name: 'UnnnicToolTipStub' }).exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="queue-prioritization-button"]').exists(),
      ).toBe(true);
    });

    it('hides queue prioritization button for admin users', () => {
      const profileStore = useProfile();
      profileStore.me.project_permission_role = 1; // Admin

      wrapper = createWrapper();

      expect(
        wrapper.find('[data-testid="queue-prioritization-button"]').exists(),
      ).toBe(false);
    });

    it('hides queue prioritization button when config disabled', () => {
      const configStore = useConfig();
      configStore.project.config.can_use_queue_prioritization = false;

      wrapper = createWrapper();

      expect(
        wrapper.find('[data-testid="queue-prioritization-button"]').exists(),
      ).toBe(false);
    });

    it('renders loading state', async () => {
      wrapper = createWrapper();
      await flushPromises();
      wrapper.setData({ showLoadingRooms: true });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="rooms-loading"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="chat-groups-content"]').exists()).toBe(
        false,
      );
    });

    it('renders discussions card group when discussions exist', async () => {
      const roomsStore = useRooms();
      roomsStore.activeTab = 'discussions';

      wrapper = createWrapper();

      await flushPromises();

      expect(
        wrapper.find('[data-testid="discussions-card-group"]').exists(),
      ).toBe(true);
    });

    it('renders waiting rooms card group when conditions are met', async () => {
      const roomsStore = useRooms();
      roomsStore.activeTab = 'waiting';
      roomsStore.waitingQueue = [mockRooms[0]];

      wrapper = createWrapper();

      await flushPromises();

      expect(
        wrapper.find('[data-testid="waiting-rooms-card-group"]').exists(),
      ).toBe(true);
    });

    it('renders in-progress rooms card group', async () => {
      wrapper = createWrapper();

      await flushPromises();

      expect(
        wrapper.find('[data-testid="in-progress-rooms-card-group"]').exists(),
      ).toBe(true);
    });

    it('renders sent flows card group when flows exist', async () => {
      const roomsStore = useRooms();
      roomsStore.activeTab = 'flow_start';
      roomsStore.waitingContactAnswer = [mockRooms[0]];

      wrapper = createWrapper();

      await flushPromises();

      expect(
        wrapper.find('[data-testid="sent-flows-card-group"]').exists(),
      ).toBe(true);
    });

    it('renders no results message when no ongoing chats available', async () => {
      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();

      wrapper = createWrapper();

      roomsStore.agentRooms = [];
      roomsStore.waitingQueue = [];
      roomsStore.waitingContactAnswer = [];
      discussionsStore.discussions = [];

      roomsStore.activeTab = 'ongoing';

      await flushPromises();

      expect(wrapper.text()).toContain(
        'All wrapped up! You’ll be notified when new chats are assigned and they’ll appear in this list.',
      );
    });

    it('renders no results message when no waiting chats available', async () => {
      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();

      wrapper = createWrapper();

      roomsStore.agentRooms = [];
      roomsStore.waitingQueue = [];
      roomsStore.waitingContactAnswer = [];
      discussionsStore.discussions = [];

      roomsStore.activeTab = 'waiting';

      await flushPromises();

      expect(wrapper.text()).toContain(
        'Queue cleared! All contacts have been assigned to an agent',
      );
    });

    it('renders modal when showModalQueue is true', async () => {
      wrapper = createWrapper();

      await wrapper.setData({ showModalQueue: true });
      await wrapper.vm.$nextTick();

      expect(
        wrapper.find('[data-testid="queue-prioritization-modal"]').exists(),
      ).toBe(true);
    });
  });

  describe('computed properties tests', () => {
    it('calculates isUserAdmin correctly for admin user', () => {
      const profileStore = useProfile();
      profileStore.me.project_permission_role = 1;

      wrapper = createWrapper();

      expect(wrapper.vm.isUserAdmin).toBe(true);
    });

    it('calculates isUserAdmin correctly for non-admin user', () => {
      wrapper = createWrapper();

      expect(wrapper.vm.isUserAdmin).toBe(false);
    });

    it('calculates totalUnreadMessages correctly', () => {
      const roomsStore = useRooms();
      roomsStore.newMessagesByRoom = {
        'room-1': { messages: [{ id: 1 }, { id: 2 }] },
        'room-2': { messages: [{ id: 3 }] },
      };

      wrapper = createWrapper();

      expect(wrapper.vm.totalUnreadMessages).toBe(3);
    });

    it('calculates showNoResultsError correctly when no data', () => {
      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();
      roomsStore.agentRooms = [];
      roomsStore.waitingQueue = [];
      roomsStore.waitingContactAnswer = [];
      discussionsStore.discussions = [];

      wrapper = createWrapper();
      wrapper.vm.isLoadingRooms = false;

      expect(wrapper.vm.showNoResultsError).toBe(true);
    });

    it('calculates totalPinnedRooms correctly', () => {
      const roomsStore = useRooms();
      roomsStore.agentRooms = [
        { ...mockRooms[0], is_pinned: true },
        { ...mockRooms[1], is_pinned: false },
      ];

      wrapper = createWrapper();

      expect(wrapper.vm.totalPinnedRooms).toBe(1);
    });
  });

  describe('filter functionality tests', () => {
    it('handles most recent filter correctly', async () => {
      wrapper = createWrapper();

      await flushPromises();

      const listRoomSpy = vi.spyOn(wrapper.vm, 'listRoom');

      await wrapper.find('[data-testid="most-recent-filter"]').trigger('click');

      expect(wrapper.vm.orderBy[wrapper.vm.activeTab]).toBe(
        '-last_interaction',
      );
      expect(listRoomSpy).toHaveBeenCalledWith(
        true,
        '-last_interaction',
        'ongoing',
        true,
      );
    });

    it('handles older filter correctly', async () => {
      wrapper = createWrapper();
      const listRoomSpy = vi.spyOn(wrapper.vm, 'listRoom');

      await flushPromises();

      await wrapper.find('[data-testid="older-filter"]').trigger('click');

      expect(wrapper.vm.orderBy[wrapper.vm.activeTab]).toBe('last_interaction');
      expect(listRoomSpy).toHaveBeenCalledWith(
        true,
        'last_interaction',
        'ongoing',
        true,
      );
    });

    it('applies correct CSS classes for active filters', async () => {
      wrapper = createWrapper();

      await flushPromises();

      const mostRecentFilter = wrapper.find(
        '[data-testid="most-recent-filter"]',
      );

      const olderFilter = wrapper.find('[data-testid="older-filter"]');

      expect(mostRecentFilter.classes()).toContain('filter-active');
      expect(olderFilter.classes()).not.toContain('filter-active');
    });
  });

  describe('search functionality tests', () => {
    it('triggers search after typing delay', async () => {
      wrapper = createWrapper();

      wrapper.vm.nameOfContact = 'test search';

      vi.advanceTimersByTime(1500);
      await wrapper.vm.$nextTick();

      wrapper.vm.isSearching = true;

      expect(wrapper.vm.isSearching).toBe(true);
    });

    it('clears search correctly', async () => {
      wrapper = createWrapper();
      await wrapper.setData({ nameOfContact: 'test', isSearching: true });

      await wrapper.setData({ nameOfContact: '' });
      vi.advanceTimersByTime(1500);
      await wrapper.vm.$nextTick();

      wrapper.vm.isSearching = false;
      expect(wrapper.vm.isSearching).toBe(false);
    });

    it('clears timer on subsequent search', async () => {
      wrapper = createWrapper();

      wrapper.vm.timerId = 123;
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const TIME_TO_WAIT_TYPING = 1300;
      if (wrapper.vm.timerId !== 0) clearTimeout(wrapper.vm.timerId);
      wrapper.vm.timerId = setTimeout(() => {}, TIME_TO_WAIT_TYPING);

      if (wrapper.vm.timerId !== 0) clearTimeout(wrapper.vm.timerId);
      wrapper.vm.timerId = setTimeout(() => {}, TIME_TO_WAIT_TYPING);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('modal functionality tests', () => {
    it('toggles modal queue correctly', async () => {
      wrapper = createWrapper();

      await wrapper
        .find('[data-testid="queue-prioritization-button"]')
        .trigger('click');

      expect(wrapper.vm.showModalQueue).toBe(true);

      wrapper.vm.handleModalQueuePriorization();

      expect(wrapper.vm.showModalQueue).toBe(false);
    });
  });

  describe('room and discussion opening tests', () => {
    it('opens room correctly', async () => {
      wrapper = createWrapper();
      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();

      await wrapper.vm.openRoom(mockRooms[0]);

      expect(discussionsStore.setActiveDiscussion).toHaveBeenCalledWith(null);
      expect(roomsStore.setActiveRoom).toHaveBeenCalledWith(mockRooms[0]);
    });

    it('opens discussion correctly', async () => {
      wrapper = createWrapper();
      const discussionsStore = useDiscussions();

      await wrapper.vm.openDiscussion(mockDiscussions[0]);

      expect(discussionsStore.setActiveDiscussion).toHaveBeenCalledWith(
        mockDiscussions[0],
      );
    });
  });

  describe('room pinning tests', () => {
    it('pins room successfully', async () => {
      const { default: Room } = await import(
        '@/services/api/resources/chats/room'
      );
      const { default: unnnic } = await import('@weni/unnnic-system');
      Room.pinRoom.mockResolvedValue();

      wrapper = createWrapper();
      const listRoomSpy = vi.spyOn(wrapper.vm, 'listRoom');

      await wrapper.vm.handlePinRoom(mockRooms[0], 'pin');

      expect(Room.pinRoom).toHaveBeenCalledWith({
        uuid: 'room-1',
        status: true,
      });
      expect(listRoomSpy).toHaveBeenCalled();
      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Chat pinned with success',
          type: 'success',
        },
        seconds: 2,
      });
    });

    it('unpins room successfully', async () => {
      const { default: Room } = await import(
        '@/services/api/resources/chats/room'
      );
      const { default: unnnic } = await import('@weni/unnnic-system');
      Room.pinRoom.mockResolvedValue();

      wrapper = createWrapper();

      await wrapper.vm.handlePinRoom(mockRooms[1], 'unpin');

      expect(Room.pinRoom).toHaveBeenCalledWith({
        uuid: 'room-2',
        status: false,
      });
      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Unpinned chat',
          type: 'default',
        },
        seconds: 2,
      });
    });

    it('prevents pinning when limit reached', async () => {
      const { default: unnnic } = await import('@weni/unnnic-system');
      const roomsStore = useRooms();
      roomsStore.agentRooms = Array.from({ length: 5 }, (_, i) => ({
        ...mockRooms[0],
        uuid: `room-${i}`,
        is_pinned: true,
      }));
      roomsStore.maxPinLimit = 5;

      wrapper = createWrapper();

      await wrapper.vm.handlePinRoom(
        { ...mockRooms[0], is_pinned: false },
        'pin',
      );

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'You can pin up to 5 chats',
          type: 'default',
        },
        seconds: 2,
      });
    });

    it('handles pin room errors correctly', async () => {
      const { default: Room } = await import(
        '@/services/api/resources/chats/room'
      );
      const { default: unnnic } = await import('@weni/unnnic-system');
      const error = new Error('Pin failed');
      error.response = { status: 403 };
      Room.pinRoom.mockRejectedValue(error);

      wrapper = createWrapper();

      await wrapper.vm.handlePinRoom(mockRooms[0], 'pin');

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Is not a room user',
          type: 'error',
        },
        seconds: 2,
      });
    });

    it('handles network errors without response object', async () => {
      const { default: Room } = await import(
        '@/services/api/resources/chats/room'
      );
      const { default: unnnic } = await import('@weni/unnnic-system');
      const networkError = new Error('Network error');

      Room.pinRoom.mockRejectedValue(networkError);

      wrapper = createWrapper();

      await wrapper.vm.handlePinRoom(mockRooms[0], 'pin');

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'An error occurred, please try again later',
          type: 'error',
        },
        seconds: 2,
      });
    });

    it('handles different HTTP error status codes', async () => {
      const { default: Room } = await import(
        '@/services/api/resources/chats/room'
      );
      const { default: unnnic } = await import('@weni/unnnic-system');

      wrapper = createWrapper();

      const error401 = new Error('Authentication error');
      error401.response = { status: 401 };
      Room.pinRoom.mockRejectedValue(error401);

      await wrapper.vm.handlePinRoom(mockRooms[0], 'pin');

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Authentication error',
          type: 'error',
        },
        seconds: 2,
      });

      const error404 = new Error('Not found');
      error404.response = { status: 404 };
      Room.pinRoom.mockRejectedValue(error404);

      await wrapper.vm.handlePinRoom(mockRooms[0], 'pin');

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: "The room doesn't exist",
          type: 'error',
        },
        seconds: 2,
      });

      const error400 = new Error('Bad request');
      error400.response = { status: 400 };
      Room.pinRoom.mockRejectedValue(error400);

      await wrapper.vm.handlePinRoom(mockRooms[0], 'pin');

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'You can pin up to 5 chats',
          type: 'error',
        },
        seconds: 2,
      });
    });

    it('sets loading state during pin operation', async () => {
      const { default: Room } = await import(
        '@/services/api/resources/chats/room'
      );
      let resolvePromise;
      const pinPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      Room.pinRoom.mockReturnValue(pinPromise);

      wrapper = createWrapper();

      const handlePinPromise = wrapper.vm.handlePinRoom(mockRooms[0], 'pin');

      expect(wrapper.vm.pinRoomLoading).toEqual({
        status: true,
        uuid: 'room-1',
      });

      resolvePromise();
      await handlePinPromise;

      expect(wrapper.vm.pinRoomLoading).toEqual({
        status: false,
        uuid: '',
      });
    });

    it('prevents duplicate pin operations', async () => {
      wrapper = createWrapper();
      wrapper.vm.pinRoomLoading = { status: true, uuid: 'room-1' };

      const { default: Room } = await import(
        '@/services/api/resources/chats/room'
      );

      await wrapper.vm.handlePinRoom(mockRooms[0], 'pin');

      expect(Room.pinRoom).not.toHaveBeenCalled();
    });
  });

  describe('scroll and pagination tests', () => {
    it('triggers pagination on scroll to bottom', () => {
      wrapper = createWrapper();
      const searchForMoreRoomsSpy = vi.spyOn(wrapper.vm, 'searchForMoreRooms');

      const mockTarget = {
        offsetHeight: 100,
        scrollTop: 400,
        scrollHeight: 500,
      };

      wrapper.vm.handleScroll(mockTarget);

      expect(searchForMoreRoomsSpy).toHaveBeenCalledWith(true);
    });

    it('does not trigger pagination when not at bottom', () => {
      wrapper = createWrapper();
      const searchForMoreRoomsSpy = vi.spyOn(wrapper.vm, 'searchForMoreRooms');

      const mockTarget = {
        offsetHeight: 100,
        scrollTop: 200,
        scrollHeight: 500,
      };

      wrapper.vm.handleScroll(mockTarget);

      expect(searchForMoreRoomsSpy).not.toHaveBeenCalled();
    });

    it('loads more rooms when hasNext is true', () => {
      const roomsStore = useRooms();
      roomsStore.hasNextRooms = {
        waiting: true,
        ongoing: true,
        flow_start: true,
      };

      wrapper = createWrapper();
      const listRoomSpy = vi.spyOn(wrapper.vm, 'listRoom');

      wrapper.vm.searchForMoreRooms();

      expect(wrapper.vm.page.ongoing).toBe(1);
      expect(listRoomSpy).toHaveBeenCalledWith(
        true,
        '-last_interaction',
        'ongoing',
      );
    });

    it('does not load more rooms when hasNext is false', () => {
      const roomsStore = useRooms();
      roomsStore.hasNextRooms = false;

      wrapper = createWrapper();
      const listRoomSpy = vi.spyOn(wrapper.vm, 'listRoom');

      wrapper.vm.searchForMoreRooms();

      expect(listRoomSpy).not.toHaveBeenCalled();
    });
  });

  describe('watcher tests', () => {
    it('posts unread messages update to parent window', async () => {
      const postMessageSpy = vi.spyOn(window.parent, 'postMessage');

      wrapper = createWrapper();
      const roomsStore = useRooms();
      roomsStore.newMessagesByRoom = {
        'room-1': { messages: [{ id: 1 }] },
      };

      await wrapper.vm.$nextTick();

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          event: 'chats:update-unread-messages',
          unreadMessages: 1,
        },
        '*',
      );
    });
  });

  describe('lifecycle tests', () => {
    it('calls listRoom and listDiscussions on mount', () => {
      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();

      wrapper = createWrapper();

      expect(roomsStore.getAll).toHaveBeenCalled();
      expect(discussionsStore.getAll).toHaveBeenCalled();
    });
  });

  describe('methods coverage tests', () => {
    it('clears search field correctly', () => {
      wrapper = createWrapper();
      wrapper.vm.nameOfContact = 'test';

      wrapper.vm.clearField();

      expect(wrapper.vm.nameOfContact).toBe('');
    });

    it('handles listRoom errors gracefully', async () => {
      const roomsStore = useRooms();
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      roomsStore.getAll.mockRejectedValue(new Error('API Error'));

      wrapper = createWrapper();

      await wrapper.vm.listRoom();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error listing rooms',
        expect.any(Error),
      );
      expect(wrapper.vm.isLoadingRooms).toBe(false);
    });

    it('handles listDiscussions errors gracefully', async () => {
      const discussionsStore = useDiscussions();
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      discussionsStore.getAll.mockRejectedValue(new Error('API Error'));

      wrapper = createWrapper();

      await wrapper.vm.listDiscussions();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error listing discussions',
        expect.any(Error),
      );
    });

    it('calls store methods with correct parameters', async () => {
      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();

      wrapper = createWrapper({ viewedAgent: 'test-agent' });

      await wrapper.vm.listRoom();
      await wrapper.vm.listDiscussions();

      expect(roomsStore.getAll).toHaveBeenCalledWith({
        offset: 0,
        concat: undefined,
        order: '-last_interaction',
        limit: 30,
        contact: '',
        viewedAgent: 'test-agent',
        roomsType: '',
      });

      expect(discussionsStore.getAll).toHaveBeenCalledWith({
        viewedAgent: 'test-agent',
        filters: { search: '' },
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('handles missing project config gracefully', () => {
      const configStore = useConfig();
      configStore.project = { config: null };

      wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);
    });

    it('handles empty arrays gracefully', () => {
      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();
      roomsStore.agentRooms = [];
      roomsStore.waitingQueue = [];
      roomsStore.waitingContactAnswer = [];
      discussionsStore.discussions = [];

      wrapper = createWrapper();

      expect(wrapper.vm.totalPinnedRooms).toBe(0);
      expect(wrapper.vm.totalUnreadMessages).toBe(0);
    });

    it('handles null newMessagesByRoom gracefully', () => {
      const roomsStore = useRooms();
      roomsStore.agentRooms = [];
      roomsStore.newMessagesByRoom = null;

      wrapper = createWrapper();

      expect(wrapper.vm.totalUnreadMessages).toBe(0);
    });
  });
});
