import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import QueueService from '@/services/api/resources/settings/queue';
import RoomService from '@/services/api/resources/chats/room';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

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

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    bulkTranfer: vi.fn(),
    getRoomTags: vi.fn(() => ({ results: [] })),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

const mockRooms = [
  { uuid: '1', queue: { sector: 's1' } },
  { uuid: '2', queue: { sector: 's1' } },
  { uuid: '3', queue: { sector: 's1' } },
];

function createStore(overrides = {}) {
  const roomsDefaults = {
    selectedOngoingRooms: ['1', '2'],
    selectedWaitingRooms: [],
    activeTab: 'ongoing',
    rooms: mockRooms,
  };

  return createTestingPinia({
    initialState: {
      rooms: { ...roomsDefaults, ...overrides },
      profile: { me: { email: 'mock@email.com' } },
    },
  });
}

function createWrapper(storeOverrides = {}, props = {}) {
  const store = createStore(storeOverrides);
  const wrapper = mount(RoomsTransferFields, {
    props: {
      modelValue: [],
      ...props,
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
    vi.clearAllMocks();
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

    it('should call transferBulk when bulkTransfer prop is true', async () => {
      RoomService.bulkTranfer.mockResolvedValue({
        data: { success_count: 2, failed_count: 0 },
      });

      const wrapper = createWrapper(
        { selectedOngoingRooms: ['1', '2'], rooms: mockRooms },
        { bulkTransfer: true },
      );

      await wrapper.setProps({
        modelValue: [{ value: 'queue-1', label: 'Queue 1' }],
      });

      await wrapper.vm.transfer();

      expect(RoomService.bulkTranfer).toHaveBeenCalledWith({
        rooms: ['1', '2'],
        intended_queue: 'queue-1',
        intended_agent: undefined,
      });
    });

    it('should call transferSingle when bulkTransfer prop is false', async () => {
      RoomService.bulkTranfer.mockResolvedValue({ status: 200 });

      const wrapper = createWrapper(
        { contactToTransfer: '1', rooms: mockRooms },
        { bulkTransfer: false },
      );

      await wrapper.setProps({
        modelValue: [{ value: 'queue-1', label: 'Queue 1' }],
      });

      await wrapper.vm.transfer();

      expect(RoomService.bulkTranfer).toHaveBeenCalled();
    });

    it('should show success toast when all rooms transfer successfully', async () => {
      RoomService.bulkTranfer.mockResolvedValue({
        data: { success_count: 2, failed_count: 0 },
      });

      const wrapper = createWrapper(
        { selectedOngoingRooms: ['1', '2'], rooms: mockRooms },
        { bulkTransfer: true },
      );

      await wrapper.setProps({
        modelValue: [{ value: 'queue-1', label: 'Queue 1' }],
      });

      await wrapper.vm.transfer();

      expect(callUnnnicAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'success' }),
        }),
      );
    });

    it('should show attention toast on partial success', async () => {
      RoomService.bulkTranfer.mockResolvedValue({
        data: { success_count: 1, failed_count: 1 },
      });

      const wrapper = createWrapper(
        { selectedOngoingRooms: ['1', '2'], rooms: mockRooms },
        { bulkTransfer: true },
      );

      await wrapper.setProps({
        modelValue: [{ value: 'queue-1', label: 'Queue 1' }],
      });

      await wrapper.vm.transfer();

      expect(callUnnnicAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'attention' }),
        }),
      );
    });

    it('should show error toast when all rooms fail', async () => {
      RoomService.bulkTranfer.mockResolvedValue({
        data: { success_count: 0, failed_count: 2 },
      });

      const wrapper = createWrapper(
        { selectedOngoingRooms: ['1', '2'], rooms: mockRooms },
        { bulkTransfer: true },
      );

      await wrapper.setProps({
        modelValue: [{ value: 'queue-1', label: 'Queue 1' }],
      });

      await wrapper.vm.transfer();

      expect(callUnnnicAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'error' }),
        }),
      );
    });

    it('should emit transfer-complete with success on full success', async () => {
      RoomService.bulkTranfer.mockResolvedValue({
        data: { success_count: 2, failed_count: 0 },
      });

      const wrapper = createWrapper(
        { selectedOngoingRooms: ['1', '2'], rooms: mockRooms },
        { bulkTransfer: true },
      );

      await wrapper.setProps({
        modelValue: [{ value: 'queue-1', label: 'Queue 1' }],
      });

      await wrapper.vm.transfer();

      expect(wrapper.emitted('transfer-complete')).toBeTruthy();
      expect(wrapper.emitted('transfer-complete')[0]).toEqual(['success']);
    });

    it('should emit transfer-complete with error when all fail', async () => {
      RoomService.bulkTranfer.mockResolvedValue({
        data: { success_count: 0, failed_count: 2 },
      });

      const wrapper = createWrapper(
        { selectedOngoingRooms: ['1', '2'], rooms: mockRooms },
        { bulkTransfer: true },
      );

      await wrapper.setProps({
        modelValue: [{ value: 'queue-1', label: 'Queue 1' }],
      });

      await wrapper.vm.transfer();

      expect(wrapper.emitted('transfer-complete')).toBeTruthy();
      expect(wrapper.emitted('transfer-complete')[0]).toEqual(['error']);
    });

    it('should chunk rooms in batches of 200', async () => {
      const manyUuids = Array.from({ length: 250 }, (_, i) => `room-${i}`);
      const manyRooms = manyUuids.map((uuid) => ({
        uuid,
        queue: { sector: 's1' },
      }));

      RoomService.bulkTranfer.mockResolvedValue({
        data: { success_count: 125, failed_count: 0 },
      });

      const wrapper = createWrapper(
        { selectedOngoingRooms: manyUuids, rooms: manyRooms },
        { bulkTransfer: true },
      );

      await wrapper.setProps({
        modelValue: [{ value: 'queue-1', label: 'Queue 1' }],
      });

      await wrapper.vm.transfer();

      expect(RoomService.bulkTranfer).toHaveBeenCalledTimes(2);

      const firstCallRooms = RoomService.bulkTranfer.mock.calls[0][0].rooms;
      const secondCallRooms = RoomService.bulkTranfer.mock.calls[1][0].rooms;

      expect(firstCallRooms).toHaveLength(200);
      expect(secondCallRooms).toHaveLength(50);
    });
  });

  describe('Alerts', () => {
    it('should call callUnnnicAlert via showAlert', () => {
      wrapper.vm.showAlert('Test message', 'success');

      expect(callUnnnicAlert).toHaveBeenCalledWith({
        props: { text: 'Test message', type: 'success' },
        seconds: 5,
      });
    });

    it('should not call callUnnnicAlert on mobile', async () => {
      const wrapper = createWrapper();
      wrapper.vm.isMobile = true;

      wrapper.vm.showAlert('Test message', 'success');

      expect(callUnnnicAlert).not.toHaveBeenCalled();
    });
  });
});
