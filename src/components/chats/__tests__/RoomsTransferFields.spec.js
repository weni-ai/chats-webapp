import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import QueueService from '@/services/api/resources/settings/queue';

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
  },
}));

function createStore(overrides = {}) {
  const roomsDefaults = {
    selectedOngoingRooms: ['1', '2'],
    selectedWaitingRooms: [],
    activeTab: 'ongoing',
  };

  return createTestingPinia({
    initialState: {
      rooms: { ...roomsDefaults, ...overrides },
      profile: { me: { email: 'mock@email.com' } },
    },
  });
}

function createWrapper(storeOverrides = {}) {
  const store = createStore(storeOverrides);
  const wrapper = mount(RoomsTransferFields, {
    props: {
      modelValue: [],
    },
    global: {
      plugins: [store],
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
      const labels = wrapper.findAllComponents({ name: 'unnnic-label' });
      const selects = wrapper.findAllComponents({
        name: 'unnnic-select-smart',
      });
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
      await wrapper.setProps({
        modelValue: [{ value: 'queue_id', label: 'Queue' }],
      });
      await wrapper.setData({
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
      await wrapper.setProps({
        modelValue: [{ value: '', label: 'Select queue' }],
      });
      await wrapper.setData({
        agents: [
          { value: '', label: 'Select agent' },
          { value: 'agent2_id', label: 'Agent2' },
        ],
      });

      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(true);
    });

    it('should show a disclaimer if no agent is found', async () => {
      vi.mocked(QueueService.agentsToTransfer).mockImplementationOnce(() => []);

      await wrapper.setProps({
        modelValue: [{ value: 'queue_id', label: 'Queue' }],
      });

      await wrapper.vm.$nextTick();

      const transferDisclaimer = wrapper.findComponent(
        '[data-testid="transfer-disclaimer"]',
      );

      expect(transferDisclaimer.exists()).toBe(true);
    });

    it('should show a disclaimer if agent selected is offline', async () => {
      vi.mocked(QueueService.agentsToTransfer).mockImplementationOnce(() => [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@doe.com',
          status: 'offline',
        },
      ]);

      await wrapper.setProps({
        modelValue: [{ value: 'queue_id', label: 'Queue' }],
      });
      await wrapper.setData({
        selectedAgent: [
          { label: 'John Doe', value: 'john@doe.com', status: 'offline' },
        ],
      });

      const transferDisclaimer = wrapper.findComponent(
        '[data-testid="transfer-disclaimer"]',
      );

      expect(transferDisclaimer.exists()).toBe(true);
    });
  });

  describe('Bulk Transfer', () => {
    it('should work with ongoing rooms selected', async () => {
      const wrapper = createWrapper({
        selectedOngoingRooms: ['1', '2'],
        selectedWaitingRooms: [],
        activeTab: 'ongoing',
      });

      expect(wrapper.vm.currentSelectedRooms).toEqual(['1', '2']);
    });

    it('should work with waiting rooms selected', async () => {
      const wrapper = createWrapper({
        selectedOngoingRooms: [],
        selectedWaitingRooms: ['3', '4'],
        activeTab: 'waiting',
      });

      expect(wrapper.vm.currentSelectedRooms).toEqual(['3', '4']);
    });

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
