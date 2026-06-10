import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import { mount, flushPromises, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import ModalTransferRooms from '../chat/ModalTransferRooms.vue';

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    bulkTranfer: vi.fn(() => Promise.resolve({ status: 200 })),
    getRoomTags: vi.fn(() => ({ results: [] })),
  },
}));

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    listByProject: vi.fn(() => ({
      results: [
        {
          name: 'Queue 1',
          sector_name: 'Sector 1',
          uuid: '1',
          sector_uuid: 's1',
        },
        {
          name: 'Queue 2',
          sector_name: 'Sector 2',
          uuid: '2',
          sector_uuid: 's2',
        },
      ],
    })),
    agentsToTransfer: vi.fn(() => [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@doe.com',
        status: 'online',
        photo_url: null,
        language: 'pt-br',
      },
      {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@doe.com',
        status: 'online',
        photo_url: null,
        language: 'pt-br',
      },
    ]),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

let savedGlobalMocks;
let savedGlobalStubs;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  savedGlobalStubs = { ...config.global.stubs };
  config.global.mocks = {};
  config.global.stubs = {
    ...savedGlobalStubs,
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
  };
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
  config.global.stubs = savedGlobalStubs;
});

function createStore(overrides = {}) {
  return createTestingPinia({
    initialState: {
      rooms: {
        selectedOngoingRooms: ['1', '2'],
        selectedWaitingRooms: [],
        activeTab: 'ongoing',
        rooms: [],
        contactToTransfer: '',
        activeRoom: null,
        activeRoomTags: [],
        ...overrides,
      },
      profile: { me: { email: 'mocked@email.com' } },
    },
  });
}

function createWrapper(store, props = {}) {
  return mount(ModalTransferRooms, {
    props: {
      modelValue: true,
      ...props,
    },
    global: {
      plugins: [store],
    },
  });
}

describe('ModalTransferRooms', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
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
      wrapper.vm.selectedQueue = [{ value: '', label: 'Select queue' }];
      await flushPromises();
      expect(wrapper.vm.disabledTransferButton).toBe(true);
    });

    it('should disable transfer button when selectedQueue is empty array', () => {
      expect(wrapper.vm.selectedQueue).toEqual([]);
      expect(wrapper.vm.disabledTransferButton).toBe(true);
    });

    it('should enable transfer button when queue is selected', async () => {
      wrapper.vm.selectedQueue = [{ value: '1', label: 'Queue' }];
      await flushPromises();
      expect(wrapper.vm.disabledTransferButton).toBe(false);
    });

    it('should show loading state when bulk transfer is in progress', async () => {
      wrapper.vm.isLoadingBulkTransfer = true;
      wrapper.vm.selectedQueue = [{ value: '1', label: 'Queue' }];
      await flushPromises();

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
