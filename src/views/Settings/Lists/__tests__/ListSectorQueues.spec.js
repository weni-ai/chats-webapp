import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import ListSectorQueues from '../ListSectorQueues/index.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { handleConnectOverlay } from '@/utils/overlay';
import Queue from '@/services/api/resources/settings/queue';
import Rooms from '@/services/api/resources/settings/rooms';
import Project from '@/services/api/resources/settings/project';
import Sector from '@/services/api/resources/settings/sector';
import Unnnic from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    editQueue: vi.fn(),
    getQueueInformation: vi.fn(),
    agents: vi.fn(),
    delete: vi.fn(),
    addAgent: vi.fn(),
    removeAgent: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    agents: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/rooms', () => ({
  default: {
    count: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn(),
  },
}));

vi.mock('@/utils/overlay', () => ({
  handleConnectOverlay: vi.fn(),
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      unnnicCallAlert: vi.fn(),
    },
  };
});

const queuesMock = [
  {
    uuid: 'queue-1',
    name: 'Alpha Queue',
    agents: 5,
    created_on: '2024-01-01T00:00:00Z',
    default_message: '',
    queue_limit: { is_active: false, limit: null },
  },
  {
    uuid: 'queue-2',
    name: 'Beta Queue',
    agents: 3,
    created_on: '2024-02-01T00:00:00Z',
    default_message: '',
    queue_limit: { is_active: true, limit: 10 },
  },
];

const createWrapper = ({ featureFlags = [], props = {} } = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      profile: {
        me: { email: 'agent.mock@test.com' },
      },
    },
  });
  setActivePinia(pinia);

  const featureFlagStore = useFeatureFlag();
  featureFlagStore.featureFlags = { active_features: featureFlags };

  return mount(ListSectorQueues, {
    attachTo: document.body,
    props: {
      sector: { uuid: 'sector-1', name: 'Sector' },
      ...props,
    },
    global: {
      plugins: [pinia],
    },
  });
};

async function confirmDeleteModal(wrapper, { action = 'end_all', queue } = {}) {
  const modal = wrapper.findComponent({ name: 'ModalDeleteWithTransfer' });
  modal.vm.confirmText = queue.name;
  modal.vm.handleActionChange(action);
  if (action === 'transfer') {
    modal.vm.selectedSector = { value: 'sector-2', label: 'Sector 2' };
    await flushPromises();
    modal.vm.selectedQueue = {
      value: 'queue-transfer-1',
      label: 'Transfer Queue',
    };
  }
  await modal.vm.$nextTick();
  modal.vm.handleConfirm();
  await flushPromises();
}

describe('ListSectorQueues.vue', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    Queue.list
      .mockResolvedValueOnce({
        results: [queuesMock[0]],
        next: true,
      })
      .mockResolvedValueOnce({
        results: [queuesMock[1]],
        next: false,
      })
      .mockResolvedValue({
        results: [
          { uuid: 'queue-transfer-1', name: 'Transfer Queue' },
          { uuid: 'queue-2', name: 'Beta Queue' },
        ],
        next: false,
      });
    Queue.create.mockResolvedValue({
      uuid: 'new-q',
      name: 'New Queue',
    });
    Queue.editQueue.mockResolvedValue({
      data: {
        uuid: 'queue-1',
        name: 'Alpha Queue Updated',
        default_message: 'Updated',
      },
    });
    Queue.delete.mockResolvedValue({});
    Queue.addAgent.mockResolvedValue({});
    Queue.removeAgent.mockResolvedValue({});
    Queue.getQueueInformation.mockResolvedValue({ uuid: 'queue-1' });
    Queue.agents.mockResolvedValue({ results: [] });
    Rooms.count.mockResolvedValue({ waiting: 2, in_service: 3 });
    Project.agents.mockResolvedValue({ results: [] });
    Sector.list.mockResolvedValue({
      results: [
        { uuid: 'sector-1', name: 'Sector' },
        { uuid: 'sector-2', name: 'Sector 2' },
      ],
    });
    window.addEventListener = vi.fn();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Rendering and loading', () => {
    it('should load paginated queues on mount', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.queues).toHaveLength(2);
      expect(Queue.list).toHaveBeenCalledWith('sector-1', 0, 10);
      expect(Queue.list).toHaveBeenCalledWith('sector-1', 10, 10);
      expect(wrapper.findAll('[data-testid="queue-card"]')).toHaveLength(2);
    });

    it('should render title and filters', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find('.sector-queues-form__title').text()).toBe(
        i18n.global.t('config_chats.queues.title'),
      );
      expect(wrapper.find('[data-testid="queue-name-filter"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="list-ordinator"]').exists()).toBe(
        true,
      );
    });
  });

  describe('queuesOrdered', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should order queues alphabetically by default', () => {
      expect(wrapper.vm.queuesOrdered.map(({ name }) => name)).toEqual([
        'Alpha Queue',
        'Beta Queue',
      ]);
    });

    it('should order queues by newer', async () => {
      wrapper.vm.queueOrder = 'newer';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.queuesOrdered.map(({ uuid }) => uuid)).toEqual([
        'queue-2',
        'queue-1',
      ]);
    });

    it('should order queues by older', async () => {
      wrapper.vm.queueOrder = 'older';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.queuesOrdered.map(({ uuid }) => uuid)).toEqual([
        'queue-1',
        'queue-2',
      ]);
    });

    it('should filter queues by name', async () => {
      wrapper.vm.queueNameFilter = 'beta';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.queuesOrdered).toHaveLength(1);
      expect(wrapper.vm.queuesOrdered[0].uuid).toBe('queue-2');
      expect(wrapper.findAll('[data-testid="queue-card"]')).toHaveLength(1);
    });
  });

  describe('Config drawer', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should open the new queue drawer', async () => {
      await wrapper.vm.openConfigQueueDrawer();
      await flushPromises();

      expect(handleConnectOverlay).toHaveBeenCalledWith(true);
      expect(wrapper.vm.showQueueDrawer).toBe(true);
      expect(wrapper.find('[data-testid="queue-config-drawer"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="queue-config-form"]').exists()).toBe(
        true,
      );
      expect(wrapper.vm.queueToConfig[0].uuid).toBeUndefined();
      expect(wrapper.vm.queueToConfig[0].name).toBe('');
    });

    it('should open the edit drawer when a queue card is clicked', async () => {
      await wrapper.find('[data-testid="queue-card"]').trigger('click');
      await flushPromises();

      expect(wrapper.vm.showQueueDrawer).toBe(true);
      expect(wrapper.vm.editQueueTitle).toBe('Alpha Queue');
      expect(wrapper.vm.queueToConfig[0].uuid).toBe('queue-1');
      expect(wrapper.vm.queueToConfig[0].queue_limit.limit).toBeNull();
      expect(wrapper.find('[data-testid="queue-config-form"]').exists()).toBe(
        true,
      );
    });

    it('should normalize queue_limit limit when editing', async () => {
      await wrapper.vm.openConfigQueueDrawer({
        ...queuesMock[1],
        queue_limit: { is_active: true, limit: 8 },
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.queueToConfig[0].queue_limit).toEqual({
        is_active: true,
        limit: '8',
      });
    });

    it('should close drawer and reset queueToConfig', async () => {
      await wrapper.vm.openConfigQueueDrawer();
      await flushPromises();

      await wrapper.find('[data-testid="secondary-button"]').trigger('click');
      await wrapper.vm.$nextTick();

      expect(handleConnectOverlay).toHaveBeenCalledWith(false);
      expect(wrapper.vm.showQueueDrawer).toBe(false);
      expect(wrapper.vm.queueToConfig).toEqual([{}]);
    });
  });

  describe('handlerSetConfigQueue - create', () => {
    beforeEach(async () => {
      wrapper = createWrapper({
        featureFlags: ['weniChatsQueueLimit', 'weniChatsQueuePurpose'],
      });
      await flushPromises();
    });

    it('should create queue, add agents and show success alert', async () => {
      wrapper.vm.queueToConfig = [
        {
          name: 'New Queue',
          default_message: 'Hi',
          queue_limit: { is_active: true, limit: '4' },
          queue_purpose: 'Sales',
          currentAgents: [{ uuid: 'agent-1' }],
          toAddAgentsUuids: [],
          toRemoveAgentsUuids: [],
        },
      ];
      await wrapper.vm.$nextTick();

      await wrapper.vm.handlerSetConfigQueue();
      await flushPromises();

      expect(Queue.create).toHaveBeenCalledWith({
        name: 'New Queue',
        default_message: 'Hi',
        sectorUuid: 'sector-1',
        queue_limit: { is_active: true, limit: '4' },
        queue_purpose: 'Sales',
        bond_flows_queue: false,
        selected_flows: [],
      });
      expect(Queue.addAgent).toHaveBeenCalledWith('new-q', 'agent-1');
      expect(wrapper.vm.queues.some((queue) => queue.uuid === 'new-q')).toBe(
        true,
      );
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: i18n.global.t('config_chats.queues.message.create'),
          type: 'success',
        },
      });
      expect(wrapper.vm.showQueueDrawer).toBe(false);
    });

    it('should omit queue flow features when feature flag is disabled', async () => {
      wrapper.unmount();
      wrapper = createWrapper({ featureFlags: [] });
      await flushPromises();

      expect(wrapper.vm.enableQueueFlowsFeature).toBe(false);

      wrapper.vm.queueToConfig = [
        {
          name: 'New Queue',
          default_message: '',
          queue_limit: { is_active: true, limit: '4' },
          queue_purpose: 'Sales',
          bond_flows_queue: true,
          selected_flows: ['flow-1'],
          currentAgents: [],
          toAddAgentsUuids: [],
          toRemoveAgentsUuids: [],
        },
      ];

      await wrapper.vm.handlerSetConfigQueue();
      await flushPromises();

      expect(Queue.create).toHaveBeenCalledWith({
        name: 'New Queue',
        default_message: '',
        sectorUuid: 'sector-1',
        queue_limit: { is_active: true, limit: '4' },
        queue_purpose: 'Sales',
        bond_flows_queue: false,
        selected_flows: [],
      });
    });
  });

  describe('handlerSetConfigQueue - update', () => {
    beforeEach(async () => {
      wrapper = createWrapper({
        featureFlags: ['weniChatsQueueLimit', 'weniChatsQueuePurpose'],
      });
      await flushPromises();
    });

    it('should update queue agents and show success alert', async () => {
      wrapper.vm.queueToConfig = [
        {
          uuid: 'queue-1',
          name: 'Alpha Queue',
          default_message: 'Updated',
          queue_limit: { is_active: true, limit: '5' },
          queue_purpose: 'Support',
          toAddAgentsUuids: ['agent-add'],
          toRemoveAgentsUuids: ['agent-remove'],
          currentAgents: [],
        },
      ];

      await wrapper.vm.handlerSetConfigQueue();
      await flushPromises();

      expect(Queue.addAgent).toHaveBeenCalledWith('queue-1', 'agent-add');
      expect(Queue.removeAgent).toHaveBeenCalledWith('agent-remove');
      expect(Queue.editQueue).toHaveBeenCalledWith({
        uuid: 'queue-1',
        default_message: 'Updated',
        queue_limit: { is_active: true, limit: '5' },
        queue_purpose: 'Support',
        bond_flows_queue: false,
        selected_flows: [],
      });
      expect(wrapper.vm.queues.find((q) => q.uuid === 'queue-1').name).toBe(
        'Alpha Queue Updated',
      );
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: i18n.global.t('config_chats.queues.message.update'),
          type: 'success',
        },
      });
    });

    it('should show error alert when config fails', async () => {
      const error = new Error('fail');
      Queue.editQueue.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      wrapper.vm.queueToConfig = [
        {
          uuid: 'queue-1',
          default_message: '',
          queue_limit: { is_active: false, limit: null },
          toAddAgentsUuids: [],
          toRemoveAgentsUuids: [],
        },
      ];

      await wrapper.vm.handlerSetConfigQueue();
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: i18n.global.t('config_chats.queues.message.error'),
          type: 'error',
        },
      });
      expect(wrapper.vm.loadingQueueConfig).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('Delete queue', () => {
    beforeEach(async () => {
      wrapper = createWrapper({
        featureFlags: ['weniChatsDeleteTransfer'],
      });
      await flushPromises();
    });

    it('should open delete modal and count rooms', async () => {
      const card = wrapper.findComponent({ name: 'QueueCard' });
      card.vm.openPopover = true;
      await card.vm.$nextTick();
      await flushPromises();

      await card
        .find('[data-testid="queue-card-delete-option"]')
        .trigger('click');
      await flushPromises();

      expect(handleConnectOverlay).toHaveBeenCalledWith(true);
      expect(Rooms.count).toHaveBeenCalledWith({ queue: 'queue-1' });
      expect(wrapper.vm.queueRoomsCount).toBe(5);
      expect(wrapper.vm.showDeleteQueueModal).toBe(true);
      expect(wrapper.find('[data-testid="delete-queue-modal"]').exists()).toBe(
        true,
      );
    });

    it('should count rooms even when transfer feature flag is not set', async () => {
      wrapper.unmount();
      wrapper = createWrapper({ featureFlags: [] });
      await flushPromises();

      await wrapper.vm.handlerOpenDeleteQueueModal(queuesMock[0]);
      await flushPromises();

      expect(Rooms.count).toHaveBeenCalledWith({ queue: 'queue-1' });
      expect(wrapper.vm.queueRoomsCount).toBe(5);
      expect(wrapper.vm.showDeleteQueueModal).toBe(true);
    });

    it('should set rooms count to 0 when Rooms.count fails', async () => {
      Rooms.count.mockRejectedValue(new Error('count failed'));

      await wrapper.vm.handlerOpenDeleteQueueModal(queuesMock[0]);
      await flushPromises();

      expect(wrapper.vm.queueRoomsCount).toBe(0);
      expect(wrapper.vm.showDeleteQueueModal).toBe(true);
    });

    it('should delete queue ending all chats', async () => {
      await wrapper.vm.handlerOpenDeleteQueueModal(queuesMock[0]);
      await flushPromises();

      await confirmDeleteModal(wrapper, {
        action: 'end_all',
        queue: queuesMock[0],
      });

      expect(Queue.delete).toHaveBeenCalledWith('queue-1', {
        endAllChats: true,
      });
      expect(
        wrapper.vm.queues.find((q) => q.uuid === 'queue-1'),
      ).toBeUndefined();
      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: i18n.global.t('delete_modal.queue_success'),
          type: 'success',
        },
      });
      expect(wrapper.vm.showDeleteQueueModal).toBe(false);
    });

    it('should delete queue transferring chats', async () => {
      await wrapper.vm.handlerOpenDeleteQueueModal(queuesMock[0]);
      await flushPromises();

      await confirmDeleteModal(wrapper, {
        action: 'transfer',
        queue: queuesMock[0],
      });

      expect(Queue.delete).toHaveBeenCalledWith('queue-1', {
        transferToQueue: 'queue-transfer-1',
      });
    });

    it('should show transfer conflict error on 409', async () => {
      Queue.delete.mockRejectedValue({ response: { status: 409 } });
      wrapper.vm.queueToDelete = queuesMock[0];

      await wrapper.vm.deleteQueue({ action: 'end_all' });
      await flushPromises();

      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: i18n.global.t('delete_modal.transfer_error_queue'),
          type: 'error',
        },
      });
    });

    it('should show generic delete error for other failures', async () => {
      Queue.delete.mockRejectedValue(new Error('delete failed'));
      wrapper.vm.queueToDelete = queuesMock[0];

      await wrapper.vm.deleteQueue({ action: 'end_all' });
      await flushPromises();

      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: i18n.global.t('delete_modal.queue_error'),
          type: 'error',
        },
      });
    });

    it('should close delete modal on cancel', async () => {
      await wrapper.vm.handlerOpenDeleteQueueModal(queuesMock[0]);
      await flushPromises();

      await wrapper
        .find('[data-testid="modal-delete-transfer-cancel"]')
        .trigger('click');
      await wrapper.vm.$nextTick();

      expect(handleConnectOverlay).toHaveBeenCalledWith(false);
      expect(wrapper.vm.showDeleteQueueModal).toBe(false);
      expect(wrapper.vm.queueToDelete).toEqual({});
    });
  });

  describe('listenConnect', () => {
    it('should close drawer when receiving close message', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      );

      const messageHandler = window.addEventListener.mock.calls.find(
        (call) => call[0] === 'message',
      )?.[1];

      await wrapper.vm.openConfigQueueDrawer();
      await flushPromises();

      const closeSpy = vi.fn();
      Object.defineProperty(wrapper.vm.$refs, 'queueDrawer', {
        value: { close: closeSpy },
        writable: true,
        configurable: true,
      });

      messageHandler({ data: { event: 'close' } });
      expect(closeSpy).toHaveBeenCalled();
    });
  });
});
