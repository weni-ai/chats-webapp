import { describe, expect, it, vi } from 'vitest'

import { mount } from '@vue/test-utils';
import { createTestingPinia  } from '@pinia/testing';
import UnnnicSystem from '@/plugins/UnnnicSystem';
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
      { first_name: 'Jane', last_name: 'Doe', email: 'jane@doe.com' },
    ]),
  }
}));

const store = createTestingPinia({
  initialState: {
    me: "mock@email.com",
    selectedRoomsToTransfer: ['1', '2'],
  }
})

function createWrapper() {
  const wrapper = mount(RoomsTransferFields, {
    global: {
      plugins: [i18n, store, UnnnicSystem],
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
      const labels = wrapper.findAllComponents({ name: 'unnnic-label'});
      const selects = wrapper.findAllComponents({ name: "unnnic-select-smart" });
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
      const agentSelect = wrapper.findComponent('[data-testid="select-agent"]');
      
      await wrapper.setData({
        selectedQueue: [{ value: 'queue_id', label: 'Queue' }],
        agents: [
          { value: '', label: 'Select agent' },
          { value: 'agent2_id', label: 'Agent2' },
        ],
      });

      await wrapper.vm.$nextTick();

      expect(agentSelect.props('disabled')).toBe(false);
      
      await wrapper.setData({
        agents: [{ value: '', label: 'Select agent' }],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(true);

      await wrapper.setData({
        selectedQueue: [{ value: '', label: 'Select queue' }],
        agents: [
          { value: '', label: 'Select agent' },
          { value: 'agent2_id', label: 'Agent2' },
        ],
      });

      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(true);
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
