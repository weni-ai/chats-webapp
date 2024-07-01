import { describe, expect, it, vi } from 'vitest'

import { mount } from '@vue/test-utils';
import { createTestingPinia  } from '@pinia/testing';
import { unnnicLabel as UnnnicLabel, unnnicSelectSmart as UnnnicSelectSmart } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import RoomsTransferFields from '../RoomsTransferFields.vue';

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
      { name: 'Jane', sector_name: 'Doe', uuid: 'jane@doe.com' },
    ]),
  }
}));

function createWrapper() {
  const wrapper = mount(RoomsTransferFields, {
    global: {
      plugins: [i18n, createTestingPinia()],
      components: { UnnnicLabel, UnnnicSelectSmart },
    },
  });

  return wrapper;
}

describe('RoomsTransferField', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  describe('Rendering', () => {
    it('should render with fields', () => {
      const labels = wrapper.findAll('unnniclabel');
      const selects = wrapper.findAll('unnnicselectsmart');
      expect(labels).toHaveLength(2);
      expect(selects).toHaveLength(2);
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
      expect(agentSelect.attributes('disabled')).toBe("false");

      wrapper.setData({
        selectedQueue: [{ value: '', label: 'Select queue' }],
        agents: [
          { value: '', label: 'Select agent' },
          { value: 'agent2_id', label: 'Agent2' },
        ],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.attributes('disabled')).toBe("true");

      wrapper.setData({
        selectedQueue: [{ value: 'queue_id', label: 'Queue' }],
        agents: [{ value: '', label: 'Select agent' }],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.attributes('disabled')).toBe("true");
    });
  });

  describe('Bulk Transfer', () => {
    it('should perform bulk transfer when transfer event is called', async () => {});

    it('should show success alert after successful bulk transfer', async () => {});

    it('should show error alert if bulk transfer fails', async () => {});
  });

  describe('Alerts', () => {
    it('should display success alert with correct message', () => {});

    it('should display error alert with correct message', () => {});
  });

  describe('Localization', () => {
    it('should display translated text for all UI elements', () => {});
  });
});
