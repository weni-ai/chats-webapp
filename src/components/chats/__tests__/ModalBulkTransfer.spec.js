import { mount } from '@vue/test-utils';
import { createTestingPinia  } from '@pinia/testing';
import UnnnicSystem from '@/plugins/UnnnicSystem';
import i18n from '@/plugins/i18n';

import ModalBulkTransfer from '../chat/ModalBulkTransfer.vue';

function createWrapper(store) {
  const wrapper = mount(ModalBulkTransfer, {
    global: {
      plugins: [i18n, createTestingPinia(), UnnnicSystem]
    },
  });

  return wrapper;
}

describe('ModalBulkTransfer', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    // store = new Vuex.Store({
    //   modules: {
    //     profile: {
    //       namespaced: true,
    //       state: {
    //         me: 'mocked@email.com',
    //       },
    //     },
    //     chats: {
    //       namespaced: true,
    //       modules: {
    //         rooms: {
    //           namespaced: true,
    //           state: {
    //             selectedRoomsToTransfer: ['1', '2'],
    //           },
    //           actions: {
    //             setSelectedRoomsToTransfer: jest.fn(),
    //           },
    //         },
    //       },
    //     },
    //   },
    // });
    wrapper = createWrapper();
  });

  describe('Rendering', () => {
    it('should render modal with select fields and buttons', () => {
      const modal = wrapper.findComponent({ name: 'unnnic-modal' });
      const labels = wrapper.findAllComponents({ name: 'unnnic-label' });
      const selects = wrapper.findAllComponents({ name: 'unnnic-select-smart'});
      const buttons = wrapper.findAllComponents('.unnnic-button');

      console.log(wrapper.html())

      expect(modal.exists()).toBe(true);
      expect(labels).toHaveLength(2);
      expect(selects).toHaveLength(2);
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Bulk Transfer', () => {
    it('should close modal after successful bulk transfer', async () => {});
  });

  describe('Button States', () => {
    let transferButton;

    beforeEach(() => {
      transferButton = wrapper.findComponent('[data-testid="transfer-button"]');
    });

    it('should disable transfer button when no queue is selected', async () => {
      await wrapper.setData({
        selectedQueue: [],
      });

      expect(transferButton.props('disabled')).toBe(true);
    });

    it('should disable transfer button when loading bulk transfer', () => {
      wrapper.setData({
        selectedQueue: [{ value: 'queue_id', label: 'Queue' }],
      });

      transferButton.trigger('click');
      expect(transferButton.props('disabled')).toBe(true);
    });
  });

  describe('Modal Interaction', () => {
    it('should close modal after clicking cancel button', () => {});
    it('should emit close event when modal is closed', () => {});
  });

  describe('Localization', () => {
    it('should display translated text for all UI elements', () => {});
  });
});
