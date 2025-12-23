import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import FormQueue from '../ListSectorQueues.vue';

import unnnic from '@weni/unnnic-system';

import Queue from '@/services/api/resources/settings/queue';
import Project from '@/services/api/resources/settings/project';

import { createTestingPinia } from '@pinia/testing';

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    list: vi.fn(),
    editQueue: vi.fn(),
    getQueueInformation: vi.fn(),
    agents: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    agents: vi.fn(),
  },
}));

vi.spyOn(Queue, 'list')
  .mockResolvedValue({ results: [], next: false })
  .mockResolvedValueOnce({
    results: [{ uuid: 'queue-1', name: 'Queue 1', agents: 5 }],
    next: true,
  })
  .mockResolvedValueOnce({
    results: [{ uuid: 'queue-2', name: 'Queue 2', agents: 3 }],
    next: false,
  });

vi.spyOn(Queue, 'editQueue').mockResolvedValue({});

vi.spyOn(Queue, 'getQueueInformation').mockResolvedValue({ uuid: 'queue-1' });

vi.spyOn(Project, 'agents').mockResolvedValue({
  results: [
    {
      uuid: '1',
      queue: '1',
      role: 1,
      user: {
        first_name: 'Agent',
        last_name: 'Mock',
        email: 'agent.mock@test.com',
      },
    },
  ],
});

vi.spyOn(Queue, 'agents').mockResolvedValue({
  results: [
    {
      uuid: '1',
      queue: '1',
      role: 1,
      user: {
        first_name: 'Agent',
        last_name: 'Mock',
        email: 'agent.mock@test.com',
      },
    },
  ],
});

const createWrapper = (props = {}) => {
  return mount(FormQueue, {
    global: { plugins: [createTestingPinia()] },
    props,
  });
};

describe('ListSectorQueues.vue', () => {
  let wrapper;
  beforeEach(async () => {
    wrapper = createWrapper({ sector: { uuid: '1' } });
    await flushPromises();
  });

  it('should load paginated queues correctly', async () => {
    expect(wrapper.vm.queues).toHaveLength(2);

    expect(wrapper.vm.queues).toEqual([
      { uuid: 'queue-1', name: 'Queue 1', agents: 5 },
      { uuid: 'queue-2', name: 'Queue 2', agents: 3 },
    ]);

    expect(Queue.list).toHaveBeenCalledTimes(2);
    expect(Queue.list).toHaveBeenCalledWith('1', 0, 10);
    expect(Queue.list).toHaveBeenCalledWith('1', 10, 10);
  });

  it('should open the new queue drawer when clicking the add button', async () => {
    const openConfigQueueDrawer = vi.spyOn(wrapper.vm, 'openConfigQueueDrawer');

    const callAlert = vi.spyOn(unnnic, 'unnnicCallAlert');

    const createQueueCard = wrapper.find('[data-testid="create-sector-card"]');

    await createQueueCard.trigger('click');

    await new Promise((resolve) => setTimeout(resolve, 1));

    expect(openConfigQueueDrawer).toHaveBeenCalled();

    const queueConfigDrawer = wrapper.findComponent(
      '[data-testid="queue-config-drawer"]',
    );

    const queueForm = wrapper.findComponent(
      '[data-testid="queue-config-form"]',
    );

    expect(queueConfigDrawer.exists()).toBe(true);
    expect(queueForm.exists()).toBe(true);
    expect(queueForm.props().sector.uuid).toBe(wrapper.props().sector.uuid);
    expect(queueForm.props().modelValue.uuid).toBe(undefined);

    queueConfigDrawer.vm.$emit('primary-button-click');

    expect(callAlert).toHaveBeenCalled();
  });

  it('should open the edit drawer when clicking on an existing queue', async () => {
    await wrapper.setData({
      queues: [{ uuid: 'queue-1', name: 'Queue 1', agents: 5 }],
    });

    const openConfigQueueDrawer = vi.spyOn(wrapper.vm, 'openConfigQueueDrawer');

    const closeConfigQueueDrawer = vi.spyOn(
      wrapper.vm,
      'closeQueueConfigDrawer',
    );

    await wrapper.find('[data-testid="queue-card"]').trigger('click');

    expect(openConfigQueueDrawer).toHaveBeenCalledWith({
      uuid: 'queue-1',
      name: 'Queue 1',
      agents: 5,
    });

    await flushPromises();

    const queueConfigDrawer = wrapper.findComponent(
      '[data-testid="queue-config-drawer"]',
    );

    const queueSectorForm = wrapper.findComponent(
      '[data-testid="queue-config-form"]',
    );

    expect(queueConfigDrawer.exists()).toBe(true);
    expect(queueSectorForm.exists()).toBe(true);

    expect(queueSectorForm.props().sector.uuid).toBe(
      wrapper.props().sector.uuid,
    );

    expect(queueSectorForm.props().modelValue.uuid).toBe(
      wrapper.vm.$data.queues[0].uuid,
    );

    await queueConfigDrawer.vm.$emit('close');

    expect(closeConfigQueueDrawer).toHaveBeenCalled();
  });

  it('should display the delete modal when handlerOpenDeleteQueueModal is called', async () => {
    await wrapper.vm.handlerOpenDeleteQueueModal({
      uuid: 'queue-uuid',
      name: 'Queue A',
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.showDeleteQueueModal).toBe(true);
    expect(wrapper.find('[data-testid="delete-queue-modal"]').exists()).toBe(
      true,
    );
  });

  it('should call deleteQueue method when confirming deletion', async () => {
    const deleteQueueSpy = vi
      .spyOn(wrapper.vm, 'deleteQueue')
      .mockImplementation();

    await wrapper.setData({
      queues: [
        { uuid: 'queue-a', name: 'Queue A' },
        { uuid: 'queue-b', name: 'Queue B' },
      ],
    });

    await wrapper.vm.handlerOpenDeleteQueueModal({
      uuid: 'queue-a',
      name: 'Queue A',
    });

    await wrapper.vm.$nextTick();

    const deleteModal = wrapper.findComponent(
      '[data-testid="delete-queue-modal"]',
    );

    await deleteModal.vm.$emit('click-action-primary');

    expect(deleteQueueSpy).toHaveBeenCalledTimes(1);

    expect(wrapper.vm.queues.length).toBe(1);
    expect(wrapper.vm.queues).toStrictEqual([
      { uuid: 'queue-b', name: 'Queue B' },
    ]);
  });

  it('should close delete queue modal on cancel', async () => {
    await wrapper.vm.handlerOpenDeleteQueueModal({
      uuid: 'queue-uuid',
      name: 'Queue A',
    });

    await wrapper.vm.$nextTick();

    const deleteModal = wrapper.findComponent(
      '[data-testid="delete-queue-modal"]',
    );

    await deleteModal.vm.$emit('click-action-secondary');

    expect(wrapper.vm.showQueueDrawer).toBe(false);
    expect(wrapper.vm.queueToConfig).toMatchObject({});
  });
});
