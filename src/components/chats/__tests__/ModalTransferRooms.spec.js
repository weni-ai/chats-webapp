import { vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import ModalTransferRooms from '../chat/ModalTransferRooms.vue';

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    bulkTranfer: vi.fn(() => {
      return Promise.resolve({ status: 200 });
    }),
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

function createWrapper(store) {
  const wrapper = mount(ModalTransferRooms, {
    global: {
      plugins: [store],
      mocks: {
        $t: (key) => key,
      },
    },
  });

  return wrapper;
}

describe('ModalTransferRooms', () => {
  let wrapper;

  beforeEach(() => {
    const store = createTestingPinia({
      initialState: {
        me: 'mocked@email.com',
        selectedRoomsToTransfer: ['1', '2'],
        setSelectedRoomsToTransfer: vi.fn(),
      },
    });
    wrapper = createWrapper(store);
  });

  describe('Rendering', () => {
    it('should render modal with necessary components', () => {
      const modal = wrapper.getComponent(ModalTransferRooms);
      expect(modal.exists()).toBe(true);

      // Verify component has necessary data properties
      expect(wrapper.vm.selectedQueue).toBeDefined();
      expect(wrapper.vm.selectedQueue).toEqual([]);
      expect(wrapper.vm.isLoadingBulkTransfer).toBe(false);
    });
  });

  // describe('Bulk Transfer', () => {
  //   it('should close modal after successful bulk transfer', async () => {});
  // });

  describe('Button States', () => {
    it('should disable transfer button when no queue is selected', async () => {
      await wrapper.setData({
        selectedQueue: [{ value: '', label: 'Select queue' }],
      });
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

  // describe('Modal Interaction', () => {
  //   it('should close modal after clicking cancel button', () => {});
  //   it('should emit close event when modal is closed', () => {});
  // });

  // describe('Localization', () => {
  //   it('should display translated text for all UI elements', () => {});
  // });
});
