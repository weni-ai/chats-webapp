import { vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import ModalBulkTransfer from '../chat/ModalBulkTransfer.vue';

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
  const wrapper = mount(ModalBulkTransfer, {
    global: {
      plugins: [store],
    },
  });

  return wrapper;
}

describe('ModalBulkTransfer', () => {
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
    it('should render modal with select fields and buttons', () => {
      const modal = wrapper.findComponent({ name: 'unnnic-modal-dialog' });
      const labels = wrapper.findAllComponents({ name: 'unnnic-label' });
      const selects = wrapper.findAllComponents({
        name: 'unnnic-select-smart',
      });
      const buttons = wrapper.findAllComponents('.unnnic-button');

      expect(modal.exists()).toBe(true);
      expect(labels).toHaveLength(2);
      expect(selects).toHaveLength(2);
      expect(buttons).toHaveLength(2);
    });
  });

  // describe('Bulk Transfer', () => {
  //   it('should close modal after successful bulk transfer', async () => {});
  // });

  describe('Button States', () => {
    let transferButton;

    beforeEach(() => {
      transferButton = wrapper.findComponent('[data-testid="primary-button"]');
    });

    it('should disable transfer button when no queue is selected', async () => {
      await wrapper.setData({
        selectedQueue: [{ value: '', label: 'Select queue' }],
      });
      expect(transferButton.props('disabled')).toBe(true);
    });

    it('should disable transfer button when loading bulk transfer', async () => {
      await wrapper.setData({
        isLoadingBulkTransfer: true,
        selectedQueue: [{ value: '1', label: 'Queue' }],
      });

      await wrapper.vm.$nextTick();

      expect(transferButton.props('loading')).toBe(true);
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
