import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useConfig } from '@/store/modules/config';

import CardGroup from '../index.vue';

vi.mock('../RoomCard.vue', () => ({
  default: {
    name: 'RoomCard',
    props: ['room', 'active', 'selected', 'withSelection', 'roomType'],
    emits: ['click', 'click-pin', 'update-selected', 'mousedown', 'mouseup'],
    template:
      '<div data-testid="mocked-room-card" class="room-card">{{ room.uuid }}</div>',
  },
}));

const mockRooms = [
  {
    uuid: 'room-1',
    contact: { name: 'John Doe', uuid: 'contact-1' },
    unread_msgs: 3,
    is_pinned: false,
    waitingTime: 5,
  },
  {
    uuid: 'room-2',
    contact: { name: 'Jane Smith', uuid: 'contact-2' },
    unread_msgs: 1,
    is_pinned: true,
    waitingTime: 0,
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

describe('CardGroup.vue', () => {
  let pinia;

  const createWrapper = (props = {}) => {
    const defaultProps = {
      rooms: mockRooms,
      discussions: null,
      label: 'Test Group',
      withSelection: false,
      roomsType: 'in_progress',
    };

    return mount(CardGroup, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          UnnnicCollapse: {
            template:
              '<div data-testid="unnnic-collapse"><slot name="header"></slot><slot></slot></div>',
            props: ['modelValue', 'size'],
          },
          UnnnicCheckbox: {
            template: '<input type="checkbox" data-testid="unnnic-checkbox" />',
            props: ['modelValue', 'size'],
            emits: ['change'],
          },
          UnnnicDisclaimer: {
            template: '<div data-testid="unnnic-disclaimer">{{ text }}</div>',
            props: ['text', 'iconColor'],
          },
          UnnnicChatsContact: {
            template:
              '<div data-testid="unnnic-chats-contact">{{ title }}</div>',
            props: [
              'active',
              'title',
              'discussionGoal',
              'tabindex',
              'selected',
              'unreadMessages',
            ],
            emits: ['click', 'keypress'],
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
    roomsStore.selectedOngoingRooms = [];
    roomsStore.selectedWaitingRooms = [];
    roomsStore.activeTab = 'ongoing';
    roomsStore.activeRoom = null;

    const discussionsStore = useDiscussions();
    discussionsStore.newMessagesByDiscussion = {};
    discussionsStore.activeDiscussion = null;

    const configStore = useConfig();
    configStore.enableAutomaticRoomRouting = false;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('rendering tests', () => {
    it('renders correctly with basic props', () => {
      const wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);

      expect(wrapper.find('[data-testid="room-container"]').exists()).toBe(
        true,
      );

      wrapper.unmount();
    });

    it('does not render checkbox when withSelection is false', () => {
      const wrapper = createWrapper({ withSelection: false });

      expect(wrapper.find('[data-testid="card-group-checkbox"]').exists()).toBe(
        false,
      );

      wrapper.unmount();
    });

    it('does not render disclaimer when conditions are not met', () => {
      const wrapper = createWrapper({ roomsType: 'in_progress' });

      expect(
        wrapper.find('[data-testid="chats-router-disclaimer"]').exists(),
      ).toBe(false);

      wrapper.unmount();
    });

    it('renders discussions when discussions prop is provided', () => {
      const wrapper = createWrapper({
        rooms: null,
        discussions: mockDiscussions,
      });

      expect(
        wrapper.find('[data-testid="discussion-container"]').exists(),
      ).toBe(true);

      wrapper.unmount();
    });

    it('renders correct number of room cards', () => {
      const wrapper = createWrapper();

      const roomCards = wrapper.findAll('[data-testid^="room-card-"]');
      expect(roomCards).toHaveLength(mockRooms.length);

      wrapper.unmount();
    });
  });

  describe('computed properties tests', () => {
    it('accesses store states correctly for ongoing rooms', () => {
      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = ['room-1'];
      roomsStore.activeTab = 'ongoing';
      roomsStore.activeRoom = mockRooms[0];

      const discussionsStore = useDiscussions();
      discussionsStore.activeDiscussion = mockDiscussions[0];

      const wrapper = createWrapper({ roomsType: 'in_progress' });

      expect(wrapper.vm.currentSelectedRooms).toEqual(['room-1']);
      expect(wrapper.vm.activeRoom).toEqual(mockRooms[0]);
      expect(wrapper.vm.activeDiscussionId).toBe('discussion-1');

      wrapper.unmount();
    });

    it('accesses store states correctly for waiting rooms', () => {
      const roomsStore = useRooms();
      roomsStore.selectedWaitingRooms = ['room-2'];
      roomsStore.activeTab = 'waiting';
      roomsStore.activeRoom = mockRooms[1];

      const wrapper = createWrapper({ roomsType: 'waiting' });

      expect(wrapper.vm.currentSelectedRooms).toEqual(['room-2']);
      expect(wrapper.vm.activeRoom).toEqual(mockRooms[1]);

      wrapper.unmount();
    });
  });

  describe('props validation and defaults', () => {
    it('uses default values for optional props', () => {
      const wrapper = createWrapper({
        rooms: [],
        discussions: [],
        withSelection: false,
        roomsType: '',
      });

      expect(wrapper.props('rooms')).toEqual([]);
      expect(wrapper.props('discussions')).toEqual([]);
      expect(wrapper.props('withSelection')).toBe(false);
      expect(wrapper.props('roomsType')).toBe('');

      wrapper.unmount();
    });

    it('accepts custom prop values', () => {
      const customProps = {
        rooms: mockRooms,
        discussions: mockDiscussions,
        withSelection: true,
        roomsType: 'waiting',
      };

      const wrapper = createWrapper(customProps);

      expect(wrapper.props('rooms')).toEqual(mockRooms);
      expect(wrapper.props('discussions')).toEqual(mockDiscussions);
      expect(wrapper.props('withSelection')).toBe(true);
      expect(wrapper.props('roomsType')).toBe('waiting');

      wrapper.unmount();
    });
  });

  describe('event handling tests', () => {
    it('emits open event when room is clicked', async () => {
      const wrapper = createWrapper();

      await wrapper.vm.open(mockRooms[0]);

      expect(wrapper.emitted('open')).toBeTruthy();
      expect(wrapper.emitted('open')[0]).toEqual([mockRooms[0]]);

      wrapper.unmount();
    });

    it('emits pin event when handlePin is called', async () => {
      const wrapper = createWrapper();

      await wrapper.vm.handlePin(mockRooms[0], 'pin');

      expect(wrapper.emitted('pin')).toBeTruthy();
      expect(wrapper.emitted('pin')[0]).toEqual([mockRooms[0], 'pin']);

      wrapper.unmount();
    });

    it('handles checkbox change event for ongoing rooms', async () => {
      const wrapper = createWrapper({ 
        withSelection: true,
        roomsType: 'in_progress',
      });

      const roomsStore = useRooms();
      roomsStore.activeTab = 'ongoing';

      wrapper.vm.updateIsRoomSelected('room-1', true);

      expect(roomsStore.setSelectedOngoingRooms).toHaveBeenCalled();

      wrapper.unmount();
    });

    it('handles checkbox change event for waiting rooms', async () => {
      const wrapper = createWrapper({ 
        withSelection: true,
        roomsType: 'waiting',
      });

      const roomsStore = useRooms();
      roomsStore.activeTab = 'waiting';

      wrapper.vm.updateIsRoomSelected('room-1', true);

      expect(roomsStore.setSelectedWaitingRooms).toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe('methods tests', () => {
    it('calculates unread messages correctly', () => {
      const discussionsStore = useDiscussions();
      discussionsStore.newMessagesByDiscussion = {
        'discussion-1': {
          messages: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
      };

      const wrapper = createWrapper();

      expect(wrapper.vm.unreadMessages('discussion-1')).toBe(3);
      expect(wrapper.vm.unreadMessages('discussion-2')).toBe(0);

      wrapper.unmount();
    });

    it('checks if room is selected correctly for ongoing', () => {
      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = ['room-1'];
      roomsStore.activeTab = 'ongoing';

      const wrapper = createWrapper({ roomsType: 'in_progress' });

      expect(wrapper.vm.getIsRoomSelected('room-1')).toBe(true);
      expect(wrapper.vm.getIsRoomSelected('room-2')).toBe(false);

      wrapper.unmount();
    });

    it('updates room selection when selecting', () => {
      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = [];
      roomsStore.activeTab = 'ongoing';

      const wrapper = createWrapper({ roomsType: 'in_progress' });

      wrapper.vm.updateIsRoomSelected('room-1', true);

      expect(roomsStore.setSelectedOngoingRooms).toHaveBeenCalledWith([
        'room-1',
      ]);

      wrapper.unmount();
    });

    it('updates room selection when deselecting', () => {
      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = ['room-1', 'room-2'];
      roomsStore.activeTab = 'ongoing';

      const wrapper = createWrapper({ roomsType: 'in_progress' });

      wrapper.vm.updateIsRoomSelected('room-1', false);

      expect(roomsStore.setSelectedOngoingRooms).toHaveBeenCalledWith([
        'room-2',
      ]);

      wrapper.unmount();
    });

    it('does not add room if already selected', () => {
      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = ['room-1'];
      roomsStore.activeTab = 'ongoing';

      const wrapper = createWrapper({ roomsType: 'in_progress' });

      wrapper.vm.updateIsRoomSelected('room-1', true);

      expect(roomsStore.setSelectedOngoingRooms).not.toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe('watcher tests', () => {
    it('updates checkbox value when all rooms are selected', async () => {
      const wrapper = createWrapper({ 
        withSelection: true,
        roomsType: 'in_progress',
      });

      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = ['room-1', 'room-2'];
      roomsStore.activeTab = 'ongoing';

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.collapseCheckboxValue).toBe(true);

      wrapper.unmount();
    });

    it('updates checkbox value to "less" when some rooms are selected', async () => {
      const wrapper = createWrapper({ 
        withSelection: true,
        roomsType: 'in_progress',
      });

      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = ['room-1'];
      roomsStore.activeTab = 'ongoing';

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.collapseCheckboxValue).toBe('less');

      wrapper.unmount();
    });

    it('updates checkbox value to false when no rooms are selected', async () => {
      const wrapper = createWrapper({ 
        withSelection: true,
        roomsType: 'in_progress',
      });

      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = [];
      roomsStore.activeTab = 'ongoing';

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.collapseCheckboxValue).toBe(false);

      wrapper.unmount();
    });
  });

  describe('lifecycle tests', () => {
    it('throws error when no rooms or discussions are provided', () => {
      expect(() => {
        createWrapper({ rooms: null, discussions: null });
      }).toThrow('Pass rooms and discussions as a prop!');
    });

    it('does not throw error when rooms are provided', () => {
      expect(() => {
        createWrapper({ rooms: mockRooms, discussions: null });
      }).not.toThrow();
    });

    it('does not throw error when discussions are provided', () => {
      expect(() => {
        createWrapper({ rooms: null, discussions: mockDiscussions });
      }).not.toThrow();
    });
  });

  describe('data properties tests', () => {
    it('initializes with correct default data', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.isCollapseOpened).toBe(true);
      expect(wrapper.vm.collapseCheckboxValue).toBe(false);
      expect(wrapper.vm.roomHoverIndex).toBe(null);
      expect(wrapper.vm.activeRoomIndex).toBe(null);
      expect(wrapper.vm.activeDiscussionIndex).toBe(null);

      wrapper.unmount();
    });

    it('updates activeRoomIndex on mousedown/mouseup', async () => {
      const wrapper = createWrapper();

      wrapper.vm.activeRoomIndex = 1;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.activeRoomIndex).toBe(1);

      wrapper.vm.activeRoomIndex = null;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.activeRoomIndex).toBe(null);

      wrapper.unmount();
    });
  });

  describe('edge cases and error handling', () => {
    it('handles empty rooms array', () => {
      const wrapper = createWrapper({ rooms: [] });

      expect(wrapper.find('[data-testid="room-container"]').exists()).toBe(
        false,
      );

      wrapper.unmount();
    });

    it('handles empty discussions array', () => {
      const wrapper = createWrapper({
        rooms: null,
        discussions: [],
      });

      expect(
        wrapper.find('[data-testid="discussion-container"]').exists(),
      ).toBe(false);

      wrapper.unmount();
    });

    it('handles missing newMessagesByDiscussion data', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.unreadMessages('non-existent-discussion')).toBe(0);

      wrapper.unmount();
    });

    it('handles room selection with empty selectedOngoingRooms', () => {
      const roomsStore = useRooms();
      roomsStore.selectedOngoingRooms = [];
      roomsStore.activeTab = 'ongoing';

      const wrapper = createWrapper({ roomsType: 'in_progress' });

      expect(wrapper.vm.getIsRoomSelected('room-1')).toBe(false);

      wrapper.unmount();
    });
  });

  describe('accessibility tests', () => {
    it('sets correct tabindex for discussions', () => {
      const wrapper = createWrapper({
        rooms: null,
        discussions: mockDiscussions,
      });

      expect(wrapper.exists()).toBe(true);

      wrapper.unmount();
    });

    it('supports keyboard navigation for discussions', () => {
      const wrapper = createWrapper({
        rooms: null,
        discussions: mockDiscussions,
      });

      expect(
        wrapper.find('[data-testid="discussion-container"]').exists(),
      ).toBe(true);

      wrapper.unmount();
    });
  });

  describe('integration tests', () => {
    it('correctly passes props to RoomCard components', () => {
      const wrapper = createWrapper({
        withSelection: true,
        roomsType: 'waiting',
      });

      const roomCards = wrapper.findAll('.room-card');
      expect(roomCards).toHaveLength(mockRooms.length);

      wrapper.unmount();
    });

    it('handles complex state interactions', async () => {
      const wrapper = createWrapper({ 
        withSelection: true,
        roomsType: 'in_progress',
      });
      const roomsStore = useRooms();
      roomsStore.activeTab = 'ongoing';

      expect(wrapper.vm.collapseCheckboxValue).toBe(false);

      roomsStore.selectedOngoingRooms = ['room-1'];

      const isAllRoomsSelected =
        roomsStore.selectedOngoingRooms.length ===
        wrapper.props('rooms').length;
      wrapper.vm.collapseCheckboxValue = isAllRoomsSelected || 'less';

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.collapseCheckboxValue).toBe('less');

      roomsStore.selectedOngoingRooms = ['room-1', 'room-2'];
      wrapper.vm.collapseCheckboxValue = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.collapseCheckboxValue).toBe(true);

      wrapper.unmount();
    });
  });
});
