import { flushPromises, mount, config } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import ModalTakeOverRooms from '../ModalTakeOverRooms.vue';
import Room from '@/services/api/resources/chats/room';
import { useRooms } from '@/store/modules/chats/rooms';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    bulkTake: vi.fn(),
    getAll: vi.fn().mockResolvedValue({ results: [], count: 0 }),
  },
}));

const unnnicCallAlertMock = vi.fn();
vi.mock('@weni/unnnic-system', () => ({
  unnnicCallAlert: (...args) => unnnicCallAlertMock(...args),
}));

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const stubs = {
  UnnnicDialog: { template: '<div><slot /></div>' },
  UnnnicDialogContent: { template: '<div><slot /></div>' },
  UnnnicDialogHeader: { template: '<div><slot /></div>' },
  UnnnicDialogTitle: { template: '<div><slot /></div>' },
  UnnnicDialogFooter: { template: '<div><slot /></div>' },
  UnnnicDialogClose: { template: '<div><slot /></div>' },
  UnnnicDisclaimer: {
    template: '<div data-testid="disclaimer-stub"><slot /></div>',
    props: ['type', 'description'],
  },
  UnnnicButton: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    props: ['text', 'type', 'loading', 'disabled'],
  },
};

const createWrapper = (selectedRooms = ['uuid1', 'uuid2', 'uuid3']) => {
  const pinia = createTestingPinia({ stubActions: false });
  const roomsStore = useRooms(pinia);

  roomsStore.selectedWaitingRooms = selectedRooms;
  roomsStore.activeTab = 'waiting';
  roomsStore.rooms = [];

  return mount(ModalTakeOverRooms, {
    props: { modelValue: true },
    global: {
      plugins: [pinia],
      stubs,
    },
  });
};

describe('ModalTakeOverRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the modal with correct title', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('bulk_take.title');
    });

    it('should render the disclaimer', () => {
      const wrapper = createWrapper();
      const disclaimer = wrapper.find('[data-testid="take-over-disclaimer"]');
      expect(disclaimer.exists()).toBe(true);
    });

    it('should render confirmation description', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('bulk_take.confirm_take_over_selected');
    });

    it('should render the take over button', () => {
      const wrapper = createWrapper();
      const takeOverButton = wrapper.find('[data-testid="take-over-button"]');
      expect(takeOverButton.exists()).toBe(true);
    });

    it('should render the cancel button', () => {
      const wrapper = createWrapper();
      const cancelButton = wrapper.find('[data-testid="cancel-button"]');
      expect(cancelButton.exists()).toBe(true);
    });
  });

  describe('bulk take execution', () => {
    it('should call Room.bulkTake with correct room UUIDs', async () => {
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 3, failed_count: 0 },
      });

      const wrapper = createWrapper();
      const takeOverButton = wrapper.find('[data-testid="take-over-button"]');
      await takeOverButton.trigger('click');
      await flushPromises();

      expect(Room.bulkTake).toHaveBeenCalledWith({
        rooms: ['uuid1', 'uuid2', 'uuid3'],
      });
    });

    it('should batch requests in chunks of 200', async () => {
      const rooms = Array.from({ length: 250 }, (_, i) => `uuid${i}`);
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 200, failed_count: 0 },
      });

      const callsBefore = Room.bulkTake.mock.calls.length;

      const wrapper = createWrapper(rooms);
      const takeOverButton = wrapper.findComponent(
        '[data-testid="take-over-button"]',
      );
      await takeOverButton.vm.$emit('click');
      await flushPromises();

      const newCalls = Room.bulkTake.mock.calls.slice(callsBefore);
      expect(newCalls).toHaveLength(2);
      expect(newCalls[0]).toEqual([{ rooms: rooms.slice(0, 200) }]);
      expect(newCalls[1]).toEqual([{ rooms: rooms.slice(200) }]);
    });
  });

  describe('toast notifications', () => {
    it('should show success toast when all rooms are taken over', async () => {
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 3, failed_count: 0 },
      });

      const wrapper = createWrapper();
      await wrapper.find('[data-testid="take-over-button"]').trigger('click');
      await flushPromises();

      expect(unnnicCallAlertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'success' }),
        }),
      );
    });

    it('should show attention toast on partial success', async () => {
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 2, failed_count: 1 },
      });

      const wrapper = createWrapper();
      await wrapper.find('[data-testid="take-over-button"]').trigger('click');
      await flushPromises();

      expect(unnnicCallAlertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'attention' }),
        }),
      );
    });

    it('should show error toast when all rooms fail', async () => {
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 0, failed_count: 3 },
      });

      const wrapper = createWrapper();
      await wrapper.find('[data-testid="take-over-button"]').trigger('click');
      await flushPromises();

      expect(unnnicCallAlertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'error' }),
        }),
      );
    });
  });

  describe('modal behavior', () => {
    it('should emit close after successful take over', async () => {
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 3, failed_count: 0 },
      });

      const wrapper = createWrapper();
      await wrapper.find('[data-testid="take-over-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close after partial success', async () => {
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 2, failed_count: 1 },
      });

      const wrapper = createWrapper();
      await wrapper.find('[data-testid="take-over-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should not emit close on all-fail (keeps modal open)', async () => {
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 0, failed_count: 3 },
      });

      const wrapper = createWrapper();
      await wrapper.find('[data-testid="take-over-button"]').trigger('click');
      await flushPromises();

      expect(wrapper.emitted('close')).toBeFalsy();
    });

    it('should emit close before clearing selected waiting rooms', async () => {
      const operationOrder = [];

      Room.bulkTake.mockResolvedValue({
        data: { success_count: 3, failed_count: 0 },
      });

      const pinia = createTestingPinia({ stubActions: false });
      const roomsStore = useRooms(pinia);
      roomsStore.selectedWaitingRooms = ['uuid1', 'uuid2'];
      roomsStore.activeTab = 'waiting';
      roomsStore.rooms = [];

      const originalSetSelectedWaitingRooms =
        roomsStore.setSelectedWaitingRooms.bind(roomsStore);
      roomsStore.setSelectedWaitingRooms = vi.fn((...args) => {
        operationOrder.push('clearSelections');
        return originalSetSelectedWaitingRooms(...args);
      });

      const wrapper = mount(ModalTakeOverRooms, {
        props: { modelValue: true },
        global: {
          plugins: [pinia],
          stubs,
        },
      });

      const originalEmit = wrapper.vm.$emit.bind(wrapper.vm);
      wrapper.vm.$emit = vi.fn((...args) => {
        if (args[0] === 'close') operationOrder.push('emitClose');
        return originalEmit(...args);
      });

      await wrapper.find('[data-testid="take-over-button"]').trigger('click');
      await flushPromises();

      expect(operationOrder.indexOf('emitClose')).toBeLessThan(
        operationOrder.indexOf('clearSelections'),
      );
    });

    it('should clear selected waiting rooms after success', async () => {
      Room.bulkTake.mockResolvedValue({
        data: { success_count: 3, failed_count: 0 },
      });

      const pinia = createTestingPinia({ stubActions: false });
      const roomsStore = useRooms(pinia);
      roomsStore.selectedWaitingRooms = ['uuid1', 'uuid2'];
      roomsStore.activeTab = 'waiting';
      roomsStore.rooms = [];

      const wrapper = mount(ModalTakeOverRooms, {
        props: { modelValue: true },
        global: {
          plugins: [pinia],
          stubs,
        },
      });

      await wrapper.find('[data-testid="take-over-button"]').trigger('click');
      await flushPromises();

      expect(roomsStore.selectedWaitingRooms).toEqual([]);
    });
  });
});
