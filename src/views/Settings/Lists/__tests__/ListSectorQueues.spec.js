import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import ListSectorQueues from '../ListSectorQueues/index.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

import Queue from '@/services/api/resources/settings/queue';
import Project from '@/services/api/resources/settings/project';

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

vi.spyOn(Queue, 'create').mockResolvedValue({ uuid: 'new-q' });
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
  return mount(ListSectorQueues, {
    global: {
      plugins: [createTestingPinia()],
    },
    props,
  });
};

describe('ListSectorQueues.vue', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(async () => {
    vi.clearAllMocks();
    Queue.list
      .mockResolvedValueOnce({
        results: [{ uuid: 'queue-1', name: 'Queue 1', agents: 5 }],
        next: true,
      })
      .mockResolvedValueOnce({
        results: [{ uuid: 'queue-2', name: 'Queue 2', agents: 3 }],
        next: false,
      })
      .mockResolvedValue({ results: [], next: false });

    wrapper = createWrapper({ sector: { uuid: '1', name: 'Sector' } });
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

  it('should open the new queue drawer when openConfigQueueDrawer is called', async () => {
    await wrapper.vm.openConfigQueueDrawer();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.showQueueDrawer).toBe(true);
    const drawer = wrapper.findComponent('[data-testid="queue-config-drawer"]');
    const form = wrapper.findComponent('[data-testid="queue-config-form"]');
    expect(drawer.exists()).toBe(true);
    expect(form.exists()).toBe(true);
    expect(form.props().sector.uuid).toBe('1');
    expect(form.props().modelValue[0].uuid).toBeUndefined();
  });

  it('should open the edit drawer when a queue card is clicked', async () => {
    await wrapper.setData({
      queues: [
        {
          uuid: 'queue-1',
          name: 'Queue 1',
          agents: 5,
          created_on: '2024-01-01T00:00:00Z',
        },
      ],
    });
    await wrapper.vm.$nextTick();

    await wrapper.find('.queue-card').trigger('click');
    await flushPromises();

    expect(wrapper.vm.showQueueDrawer).toBe(true);
    const form = wrapper.findComponent('[data-testid="queue-config-form"]');
    expect(form.exists()).toBe(true);
    expect(form.props().modelValue[0].uuid).toBe('queue-1');
  });

  it('should remove a queue from the list when deleteQueue runs', async () => {
    await wrapper.setData({
      queues: [
        { uuid: 'queue-a', name: 'Queue A' },
        { uuid: 'queue-b', name: 'Queue B' },
      ],
    });

    await wrapper.vm.deleteQueue({ uuid: 'queue-a', name: 'Queue A' });

    expect(wrapper.vm.queues).toEqual([{ uuid: 'queue-b', name: 'Queue B' }]);
  });
});
