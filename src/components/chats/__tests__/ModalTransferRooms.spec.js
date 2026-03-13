import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import ModalTransferRooms from '../chat/ModalTransferRooms.vue';

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    bulkTranfer: vi.fn(() => {
      return Promise.resolve({ status: 200 });
    }),
    getRoomTags: vi.fn(() => ({ results: [] })),
  },
}));

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    listByProject: vi.fn(() => ({
      results: [
        { name: 'Queue 1', sector_name: 'Sector 1', uuid: '1' },
        { name: 'Queue 2', sector_name: 'Sector 2', uuid: '2' },
      ],
    })),
    agentsToTransfer: vi.fn(() => [
      { first_name: 'John', last_name: 'Doe', email: 'john@doe.com' },
      { first_name: 'Jane', last_name: 'Doe', email: 'jane@doe.com' },
    ]),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

function createStore(overrides = {}) {
  return createTestingPinia({
    initialState: {
      rooms: {
        selectedOngoingRooms: ['1', '2'],
        selectedWaitingRooms: [],
        activeTab: 'ongoing',
        ...overrides,
      },
      profile: { me: { email: 'mocked@email.com' } },
    },
  });
}

function createWrapper(store, props = {}) {
  const wrapper = mount(ModalTransferRooms, {
    props: {
      modelValue: true,
      ...props,
    },
    global: {
      plugins: [store],
      mocks: {
        $t: (key) => key,
        $tc: (key, count, params) => `${key}_${count}`,
      },
      stubs: {
        UnnnicDialog: {
          template: '<div><slot /></div>',
          props: ['open'],
        },
        UnnnicDialogContent: {
          template: '<div><slot /></div>',
          props: ['size'],
        },
        UnnnicDialogHeader: {
          template: '<div><slot /></div>',
          props: ['closeButton'],
        },
        UnnnicDialogTitle: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogFooter: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogClose: {
          template: '<div><slot /></div>',
        },
        UnnnicButton: {
          template: '<button v-bind="$attrs"><slot /></button>',
          props: ['text', 'type', 'loading', 'disabled'],
        },
        UnnnicDisclaimer: {
          template: '<div v-bind="$attrs">{{ description }}</div>',
          props: ['type', 'description'],
        },
      },
    },
  });

  return wrapper;
}

describe('ModalTransferRooms', () => {
  let wrapper;

  beforeEach(() => {
    const store = createStore();
    wrapper = createWrapper(store);
  });

  describe('Rendering', () => {
    it('should render modal with necessary components', () => {
      const modal = wrapper.getComponent(ModalTransferRooms);
      expect(modal.exists()).toBe(true);

      expect(wrapper.vm.selectedQueue).toBeDefined();
      expect(wrapper.vm.selectedQueue).toEqual([]);
      expect(wrapper.vm.isLoadingBulkTransfer).toBe(false);
    });

    it('should show disclaimer when bulkTransfer is true', () => {
      const store = createStore();
      const wrapper = createWrapper(store, { bulkTransfer: true });

      const disclaimer = wrapper.find('[data-testid="transfer-disclaimer"]');
      expect(disclaimer.exists()).toBe(true);
    });

    it('should hide disclaimer when bulkTransfer is false', () => {
      const store = createStore();
      const wrapper = createWrapper(store, { bulkTransfer: false });

      const disclaimer = wrapper.find('[data-testid="transfer-disclaimer"]');
      expect(disclaimer.exists()).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should use selectedOngoingRooms when activeTab is ongoing', () => {
      const store = createStore({
        selectedOngoingRooms: ['a', 'b'],
        selectedWaitingRooms: ['c'],
        activeTab: 'ongoing',
      });
      const wrapper = createWrapper(store, { bulkTransfer: true });

      expect(wrapper.vm.currentSelectedRooms).toEqual(['a', 'b']);
    });

    it('should use selectedWaitingRooms when activeTab is waiting', () => {
      const store = createStore({
        selectedOngoingRooms: ['a'],
        selectedWaitingRooms: ['c', 'd'],
        activeTab: 'waiting',
      });
      const wrapper = createWrapper(store, { bulkTransfer: true });

      expect(wrapper.vm.currentSelectedRooms).toEqual(['c', 'd']);
    });

    it('should compute disclaimerDescription based on selected rooms count', () => {
      const store = createStore({
        selectedOngoingRooms: ['1', '2', '3'],
        activeTab: 'ongoing',
      });
      const wrapper = createWrapper(store, { bulkTransfer: true });

      expect(wrapper.vm.disclaimerDescription).toBeTruthy();
    });
  });

  describe('Button States', () => {
    it('should disable transfer button when no queue is selected', async () => {
      await wrapper.setData({
        selectedQueue: [{ value: '', label: 'Select queue' }],
      });
      expect(wrapper.vm.disabledTransferButton).toBe(true);
    });

    it('should disable transfer button when selectedQueue is empty array', () => {
      expect(wrapper.vm.selectedQueue).toEqual([]);
      expect(wrapper.vm.disabledTransferButton).toBe(true);
    });

    it('should enable transfer button when queue is selected', async () => {
      await wrapper.setData({
        selectedQueue: [{ value: '1', label: 'Queue' }],
      });
      expect(wrapper.vm.disabledTransferButton).toBe(false);
    });

    it('should show loading state when bulk transfer is in progress', async () => {
      await wrapper.setData({
        isLoadingBulkTransfer: true,
        selectedQueue: [{ value: '1', label: 'Queue' }],
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isLoadingBulkTransfer).toBe(true);
    });
  });

  describe('Transfer Complete', () => {
    it('should reset loading and emit close on success', () => {
      wrapper.vm.isLoadingBulkTransfer = true;

      wrapper.vm.transferComplete('success');

      expect(wrapper.vm.isLoadingBulkTransfer).toBe(false);
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should reset loading but not close on error', () => {
      wrapper.vm.isLoadingBulkTransfer = true;

      wrapper.vm.transferComplete('error');

      expect(wrapper.vm.isLoadingBulkTransfer).toBe(false);
      expect(wrapper.emitted('close')).toBeFalsy();
    });
  });
});
