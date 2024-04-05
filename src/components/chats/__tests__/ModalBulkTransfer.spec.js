import { mount } from '@vue/test-utils';
import {
  unnnicModal,
  unnnicLabel,
  unnnicSelectSmart,
  unnnicButton,
} from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import ModalBulkTransfer from '../chat/ModalBulkTransfer.vue';

function createWrapper() {
  const wrapper = mount(ModalBulkTransfer, {
    i18n,
  });

  return wrapper;
}

describe('ModalBulkTransfer', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
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
    it('should load queues when created', () => {});
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
      expect(agentSelect.props('disabled')).toBe(true);
    });
  });

  describe('Bulk Transfer', () => {
    it('should perform bulk transfer when transfer button is clicked', async () => {});

    it('should show success alert after successful bulk transfer', async () => {});

    it('should show error alert if bulk transfer fails', async () => {});

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

  describe('Alerts', () => {
    it('should display success alert with correct message', () => {});

    it('should display error alert with correct message', () => {});
  });

  describe('Localization', () => {
    it('should display translated text for all UI elements', () => {});
  });
});
