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

const mockBulkTranfer = jest.fn((status) => ({
  status,
}));

jest.mock('@/services/api/resources/chats/room', () => ({
  bulkTranfer: (status) => mockBulkTranfer(status),
}));

jest.mock('@/services/api/resources/settings/queue', () => ({
  listByProject: jest.fn(() => ({
    results: [
      { name: 'Queue 1', sector_name: 'Sector 1', uuid: '1' },
      { name: 'Queue 2', sector_name: 'Sector 2', uuid: '2' },
    ],
  })),
  agentsToTransfer: jest.fn(() => [
    { first_name: 'John', last_name: 'Doe', email: 'john@doe.com' },
    { name: 'Jane', sector_name: 'Doe', uuid: 'jane@doe.com' },
  ]),
}));

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

  describe('Data Loading', () => {
    it('should load queues when created', async () => {
      expect(wrapper.vm.queues.length).toBeGreaterThan(1);
    });
  });

  describe('Field Behavior', () => {
    it('should disable agent field when queue is not selected or do not have agents to select', async () => {
      const agentSelect = wrapper.find('[data-testid="select-agent"]');

      wrapper.setData({
        selectedQueue: [{ value: 'queue_id', label: 'Queue' }],
        agents: [
          { value: '', label: 'Select agent' },
          { value: 'agent2_id', label: 'Agent2' },
        ],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(false);

      wrapper.setData({
        selectedQueue: [{ value: '', label: 'Select queue' }],
        agents: [
          { value: '', label: 'Select agent' },
          { value: 'agent2_id', label: 'Agent2' },
        ],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(true);

      wrapper.setData({
        selectedQueue: [{ value: 'queue_id', label: 'Queue' }],
        agents: [{ value: '', label: 'Select agent' }],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(false);
    });
  });

  describe('Bulk Transfer', () => {
    let transferButton;

    beforeEach(() => {
      wrapper.setData({
        selectedQueue: [
          { value: 'queue_id', label: 'Queue', queue_name: 'Queue' },
        ],
      });

      transferButton = wrapper.find('[data-testid="transfer-button"]');
    });

    it('should perform bulk transfer when transfer button is clicked', async () => {
      await transferButton.trigger('click');
      expect(mockBulkTranfer).toHaveBeenCalledTimes(1);
    });

    it('should show success alert after successful bulk transfer', async () => {
      mockBulkTranfer.mockResolvedValueOnce({ status: 200 });

      await transferButton.trigger('click');
      expect(document.querySelector('.alert')).not.toBeNull();
    });

    it('should show error alert if bulk transfer fails', async () => {
      mockBulkTranfer.mockResolvedValueOnce({ status: 404 });

      await transferButton.trigger('click');
      expect(document.querySelector('.alert')).not.toBeNull();
    });

    it('should close modal after successful bulk transfer', async () => {
      await transferButton.trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Button States', () => {
    it('should disable transfer button when no queue is selected', () => {});

    it('should disable transfer button when loading bulk transfer', () => {});
  });

  describe('Modal Interaction', () => {
    it('should close modal after clicking cancel button', () => {});
    it('should emit close event when modal is closed', () => {});
  });

  describe('Alerts', () => {
    it('should display success alert with correct message', () => {});

    it('should display error alert with correct message', () => {});
  });

  describe('Localization', () => {
    it('should display translated text for all UI elements', () => {});
  });
});
