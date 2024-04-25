import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import {
  unnnicModal,
  unnnicLabel,
  unnnicSelectSmart,
  unnnicButton,
} from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import ModalBulkTransfer from '../chat/ModalBulkTransfer.vue';

const localVue = createLocalVue();

localVue.use(Vuex);

function createWrapper(store) {
  const wrapper = mount(ModalBulkTransfer, {
    stubs: {
      UnnnicButton: unnnicButton,
      Alert: true,
    },
    i18n,
    store,
    localVue,
  });

  return wrapper;
}

describe('ModalBulkTransfer', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        profile: {
          namespaced: true,
          state: {
            me: 'mocked@email.com',
          },
        },
        chats: {
          namespaced: true,
          modules: {
            rooms: {
              namespaced: true,
              state: {
                selectedRoomsToTransfer: ['1', '2'],
              },
              actions: {
                setSelectedRoomsToTransfer: jest.fn(),
              },
            },
          },
        },
      },
    });
    wrapper = createWrapper(store);
  });

  describe('Rendering', () => {
    it('should render modal with select fields and buttons', () => {
      const modal = wrapper.findComponent(unnnicModal);
      const labels = wrapper.findAllComponents(unnnicLabel);
      const selects = wrapper.findAllComponents(unnnicSelectSmart);
      const buttons = wrapper.findAllComponents(unnnicButton);

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
      transferButton = wrapper.find('[data-testid="transfer-button"]');
    });

    it('should disable transfer button when no queue is selected', () => {
      wrapper.setData({
        selectedQueue: [{ value: '', label: 'Select a queue' }],
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
