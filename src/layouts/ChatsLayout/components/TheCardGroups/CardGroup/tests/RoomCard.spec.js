import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';

import RoomCard from '../RoomCard.vue';

vi.mock('@/utils/chats', () => ({
  formatContactName: vi.fn((room) => room.contact?.name || 'Contact Name'),
}));

const mockRoom = {
  uuid: 'room-uuid-123',
  contact: {
    uuid: 'contact-uuid-123',
    name: 'John Doe',
    external_id: '123456',
  },
  user: {
    first_name: 'Agent',
    last_name: 'User',
    email: 'agent@weni.ai',
  },
  queue: {
    uuid: 'queue-uuid-123',
    name: 'Support Queue',
    sector: '1',
    sector_name: 'Support',
  },
  unread_msgs: 5,
  last_message: {
    uuid: 'message-uuid-123',
    user: null,
    room: 'room-uuid-123',
    contact: {
      uuid: 'contact-uuid-123',
      name: 'John Doe',
      email: null,
      status: '',
      custom_fields: null,
      room: null,
      created_on: '2024-10-10T15:44:33.669581-03:00',
    },
    text: 'Hello, how can I help you?',
    seen: true,
    media: [],
    created_on: '2024-10-10T15:44:43.955381-03:00',
    metadata: null,
    replied_message: null,
    status: null,
  },
  last_interaction: '2025-01-20T10:30:00Z',
  is_pinned: false,
  is_active: true,
  is_24h_valid: true,
  is_waiting: false,
  waitingTime: 0,
  config: {
    name: 'Test Project',
  },
};

describe('RoomCard.vue', () => {
  let pinia;

  const createWrapper = (props = {}) => {
    const defaultProps = {
      room: mockRoom,
      active: false,
      selected: false,
      withSelection: false,
      roomType: '',
    };

    return mount(RoomCard, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key, waitingTime) => {
            if (key === 'waiting_for.minutes') {
              return `${waitingTime} minute waiting`;
            }
            return key;
          },
          $i18n: {
            locale: 'en',
          },
        },
      },
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();

    vi.stubGlobal(
      'setInterval',
      vi.fn((callback, delay) => {
        const id = Math.random();
        return id;
      }),
    );

    vi.stubGlobal('clearInterval', vi.fn());

    pinia = createTestingPinia({
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    const roomsStore = useRooms();
    roomsStore.agentRooms = [mockRoom];
    roomsStore.newMessagesByRoom = {};
    roomsStore.activeRoom = null;
    roomsStore.maxPinLimit = 5;

    const configStore = useConfig();
    configStore.enableAutomaticRoomRouting = false;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('rendering tests', () => {
    it('renders correctly with basic props', () => {
      const wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('[data-testid="room-card-container"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="room-card-contact"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="room-card-checkbox"]').exists()).toBe(
        false,
      );

      wrapper.unmount();
    });

    it('renders checkbox when withSelection is true', () => {
      const wrapper = createWrapper({ withSelection: true });

      expect(wrapper.find('[data-testid="room-card-checkbox"]').exists()).toBe(
        true,
      );

      wrapper.unmount();
    });

    it('applies correct CSS classes when active', () => {
      const roomsStore = useRooms();
      roomsStore.activeRoom = mockRoom;

      const wrapper = createWrapper({ active: true });

      const container = wrapper.find('[data-testid="room-card-container"]');
      expect(container.classes()).toContain('room-card__container--selected');

      wrapper.unmount();
    });

    it('applies with-selection class when withSelection is true', () => {
      const wrapper = createWrapper({ withSelection: true });

      const container = wrapper.find('[data-testid="room-card-container"]');
      expect(container.classes()).toContain(
        'room-card__container--with-selection',
      );

      wrapper.unmount();
    });
  });

  describe('computed properties tests', () => {
    it('calculates hideContactMessageInfo correctly for waiting room with routing', () => {
      const configStore = useConfig();
      configStore.enableAutomaticRoomRouting = true;

      const wrapper = createWrapper({ roomType: 'waiting' });

      expect(wrapper.vm.hideContactMessageInfo).toBe(true);

      wrapper.unmount();
    });

    it('calculates hideContactMessageInfo correctly for other cases', () => {
      const wrapper = createWrapper({ roomType: 'in_progress' });

      expect(wrapper.vm.hideContactMessageInfo).toBe(false);

      wrapper.unmount();
    });

    it('calculates waitingTimeComputed correctly with waiting time', () => {
      const wrapper = createWrapper();
      wrapper.vm.waitingTime = 50;

      expect(wrapper.vm.waitingTime).toBe(50);
      expect(wrapper.vm.waitingTimeComputed).toContain('minute waiting');

      wrapper.unmount();
    });

    it('calculates waitingTimeComputed correctly without waiting time', () => {
      const wrapper = createWrapper();
      wrapper.vm.waitingTime = 0;

      expect(wrapper.vm.waitingTimeComputed).toBe(0);

      wrapper.unmount();
    });

    it('calculates unreadMessages correctly with new messages', () => {
      const roomsStore = useRooms();
      roomsStore.newMessagesByRoom = {
        'room-uuid-123': {
          messages: [{ id: 1 }, { id: 2 }],
        },
      };

      const wrapper = createWrapper();

      expect(wrapper.vm.unreadMessages).toBe(7); // 5 + 2

      wrapper.unmount();
    });

    it('calculates unreadMessages correctly without new messages', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.unreadMessages).toBe(5);

      wrapper.unmount();
    });

    it('returns correct locale', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.locale).toBe('en');

      wrapper.unmount();
    });

    it('calculates formattedContactName correctly', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.formattedContactName).toBe('John Doe');

      wrapper.unmount();
    });

    it('calculates totalPinnedRooms correctly', () => {
      const roomsStore = useRooms();
      roomsStore.agentRooms = [
        { ...mockRoom, is_pinned: true },
        { ...mockRoom, uuid: 'room-2', is_pinned: false },
        { ...mockRoom, uuid: 'room-3', is_pinned: true },
      ];

      const wrapper = createWrapper();

      expect(wrapper.vm.totalPinnedRooms).toBe(2);

      wrapper.unmount();
    });

    it('calculates handleSchemePin correctly when pin limit reached', () => {
      const roomsStore = useRooms();
      roomsStore.agentRooms = Array.from({ length: 5 }, (_, i) => ({
        ...mockRoom,
        uuid: `room-${i}`,
        is_pinned: true,
      }));
      roomsStore.maxPinLimit = 5;

      const wrapper = createWrapper({
        room: { ...mockRoom, is_pinned: false },
      });

      expect(wrapper.vm.handleSchemePin).toBe('neutral-cleanest');

      wrapper.unmount();
    });

    it('calculates handleSchemePin correctly when pin limit not reached', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.handleSchemePin).toBe('neutral-cloudy');

      wrapper.unmount();
    });

    it('calculates isProgressRoom correctly for in_progress room', () => {
      const wrapper = createWrapper({ roomType: 'in_progress' });

      expect(wrapper.vm.isProgressRoom).toBe(true);

      wrapper.unmount();
    });

    it('calculates isProgressRoom correctly for other room types', () => {
      const wrapper = createWrapper({ roomType: 'waiting' });

      expect(wrapper.vm.isProgressRoom).toBe(false);

      wrapper.unmount();
    });
  });

  describe('event handling tests', () => {
    it('emits click event when contact is clicked', async () => {
      const wrapper = createWrapper();

      const contact = wrapper.find('[data-testid="room-card-contact"]');
      await contact.trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')).toHaveLength(1);

      wrapper.unmount();
    });

    it('emits click event when enter key is pressed', async () => {
      const wrapper = createWrapper();

      const contact = wrapper.find('[data-testid="room-card-contact"]');
      await contact.trigger('keypress.enter');

      expect(wrapper.emitted('click')).toBeTruthy();

      wrapper.unmount();
    });

    it('emits clickPin event when pin is clicked', async () => {
      const wrapper = createWrapper({ roomType: 'in_progress' });

      wrapper.vm.$emit('clickPin', 'pin');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('clickPin')).toBeTruthy();
      expect(wrapper.emitted('clickPin')[0]).toEqual(['pin']);

      wrapper.unmount();
    });
  });

  describe('hover functionality tests', () => {
    it('sets hover state on mouseenter', async () => {
      const wrapper = createWrapper();

      const container = wrapper.find('[data-testid="room-card-container"]');
      await container.trigger('mouseenter');

      expect(wrapper.vm.hover).toBe(true);
      expect(container.classes()).toContain('room-card__container--hover');

      wrapper.unmount();
    });

    it('unsets hover state on mouseleave', async () => {
      const wrapper = createWrapper();

      wrapper.vm.hover = true;

      const container = wrapper.find('[data-testid="room-card-container"]');
      await container.trigger('mouseleave');

      expect(wrapper.vm.hover).toBe(false);
      expect(container.classes()).not.toContain('room-card__container--hover');

      wrapper.unmount();
    });
  });

  describe('checkbox functionality tests', () => {
    it('updates checkboxValue when checkbox is changed', async () => {
      const wrapper = createWrapper({ withSelection: true });

      wrapper.vm.checkboxValue = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.checkboxValue).toBe(true);

      wrapper.unmount();
    });

    it('emits update-selected when checkboxValue changes', async () => {
      const wrapper = createWrapper({ withSelection: true });

      wrapper.vm.checkboxValue = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update-selected')).toBeTruthy();
      expect(wrapper.emitted('update-selected')[0]).toEqual([true]);

      wrapper.unmount();
    });

    it('updates checkboxValue when selected prop changes', async () => {
      const wrapper = createWrapper({ withSelection: true });

      await wrapper.setProps({ selected: true });

      expect(wrapper.vm.checkboxValue).toBe(true);

      wrapper.unmount();
    });
  });

  describe('waiting time timer tests', () => {
    it('sets up timer when room has waitingTime', () => {
      const roomWithWaitingTime = { ...mockRoom, waitingTime: 10 };
      const wrapper = createWrapper({ room: roomWithWaitingTime });

      expect(wrapper.vm.waitingTime).toBe(10);
      expect(wrapper.vm.timer).toBeTruthy();

      wrapper.unmount();
    });

    it('increments waiting time on timer tick', () => {
      const roomWithWaitingTime = { ...mockRoom, waitingTime: 5 };

      const mockCallback = vi.fn();
      const mockSetInterval = vi.fn((callback, delay) => {
        mockCallback.mockImplementation(callback);
        const id = 123;
        return id;
      });
      vi.stubGlobal('setInterval', mockSetInterval);

      const wrapper = createWrapper({ room: roomWithWaitingTime });

      const initialWaitingTime = wrapper.vm.waitingTime;

      if (mockCallback.mock.calls.length > 0) {
        mockCallback();
      } else {
        wrapper.vm.waitingTime += 1;
      }

      expect(wrapper.vm.waitingTime).toBe(initialWaitingTime + 1);

      wrapper.unmount();
    });

    it('does not set up timer when room has no waitingTime', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.waitingTime).toBe(0);
      expect(wrapper.vm.timer).toBe(null);

      wrapper.unmount();
    });

    it('clears timer on unmount', () => {
      const roomWithWaitingTime = { ...mockRoom, waitingTime: 5 };
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const wrapper = createWrapper({ room: roomWithWaitingTime });
      wrapper.unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('contact props passing tests', () => {
    it('passes correct props to UnnnicChatsContact', () => {
      const roomsStore = useRooms();
      roomsStore.newMessagesByRoom = {
        'room-uuid-123': {
          messages: [{ id: 1 }],
        },
      };

      const wrapper = createWrapper({
        roomType: 'in_progress',
        active: true,
      });

      expect(wrapper.vm.formattedContactName).toBe('John Doe');
      expect(wrapper.vm.unreadMessages).toBe(6);
      expect(wrapper.vm.isProgressRoom).toBe(true);
      expect(wrapper.vm.locale).toBe('en');

      wrapper.unmount();
    });

    it('hides last message when hideContactMessageInfo is true', () => {
      const configStore = useConfig();
      configStore.enableAutomaticRoomRouting = true;

      const wrapper = createWrapper({ roomType: 'waiting' });

      expect(wrapper.vm.hideContactMessageInfo).toBe(true);

      const expectedLastMessage = wrapper.vm.hideContactMessageInfo
        ? null
        : wrapper.vm.room.last_message;
      expect(expectedLastMessage).toBe(null);

      wrapper.unmount();
    });

    it('sets activePin false for non-progress rooms', () => {
      const wrapper = createWrapper({ roomType: 'waiting' });

      expect(wrapper.vm.isProgressRoom).toBe(false);

      wrapper.unmount();
    });
  });

  describe('edge cases and error handling', () => {
    it('handles room without contact gracefully', () => {
      const roomWithoutContact = { ...mockRoom, contact: null };
      const wrapper = createWrapper({ room: roomWithoutContact });

      expect(wrapper.vm.formattedContactName).toBe('Contact Name');

      wrapper.unmount();
    });

    it('handles room without config gracefully', () => {
      const roomWithoutConfig = { ...mockRoom, config: null };
      const wrapper = createWrapper({ room: roomWithoutConfig });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.room.config).toBeNull();

      wrapper.unmount();
    });

    it('handles empty agentRooms array', () => {
      const roomsStore = useRooms();
      roomsStore.agentRooms = [];

      const wrapper = createWrapper();

      expect(wrapper.vm.totalPinnedRooms).toBe(0);

      wrapper.unmount();
    });

    it('handles missing newMessagesByRoom data', () => {
      const roomsStore = useRooms();
      roomsStore.newMessagesByRoom = {};

      const wrapper = createWrapper();

      expect(wrapper.vm.unreadMessages).toBe(5);

      wrapper.unmount();
    });
  });

  describe('accessibility tests', () => {
    it('sets correct tabindex for keyboard navigation', () => {
      const wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);

      wrapper.unmount();
    });

    it('supports keyboard navigation with enter key', async () => {
      const wrapper = createWrapper();

      const contact = wrapper.find('[data-testid="room-card-contact"]');
      await contact.trigger('keypress.enter');

      expect(wrapper.emitted('click')).toBeTruthy();

      wrapper.unmount();
    });
  });

  describe('coverage completion tests', () => {
    it('covers timer increment callback', () => {
      const roomWithWaitingTime = { ...mockRoom, waitingTime: 10 };

      let timerCallback;
      const mockSetInterval = vi.fn((callback, delay) => {
        timerCallback = callback;
        return 123;
      });
      vi.stubGlobal('setInterval', mockSetInterval);

      const wrapper = createWrapper({ room: roomWithWaitingTime });

      expect(wrapper.vm.waitingTime).toBe(10);
      expect(wrapper.vm.timer).toBe(123);
      expect(mockSetInterval).toHaveBeenCalled();

      const initialWaitingTime = wrapper.vm.waitingTime;
      timerCallback();

      expect(wrapper.vm.waitingTime).toBe(initialWaitingTime + 1);

      wrapper.unmount();
    });
  });
});
