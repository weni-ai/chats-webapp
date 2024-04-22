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
    it('should perform bulk transfer when transfer button is clicked', async () => {});

    it('should close modal after successful bulk transfer', async () => {});
  });

  describe('Button States', () => {
    it('should disable transfer button when no queue is selected', () => {});

    it('should disable transfer button when loading bulk transfer', () => {});
  });

  describe('Modal Interaction', () => {
    it('should close modal after clicking cancel button', () => {});
    it('should emit close event when modal is closed', () => {});
  });

  describe('Localization', () => {
    it('should display translated text for all UI elements', () => {});
  });
});
