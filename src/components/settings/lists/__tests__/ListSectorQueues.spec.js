import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import FormQueue from '../ListSectorQueues.vue';

import Queue from '@/services/api/resources/settings/queue';

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

const createWrapper = (props = {}) => {
  return mount(FormQueue, { props });
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
    const openNewQueueDrawerSpy = vi.spyOn(wrapper.vm, 'openNewQueueDrawer');

    const createSectorCard = wrapper.find('[data-testid="create=sector-card"]');

    await createSectorCard.trigger('click');

    expect(openNewQueueDrawerSpy).toHaveBeenCalled();
  });

  it('should open the edit modal when clicking on an existing queue', async () => {
    await wrapper.setData({
      queues: [{ uuid: 'queue-1', name: 'Queue 1', agents: 5 }],
    });

    const openNewQueueDrawerSpy = vi.spyOn(wrapper.vm, 'openEditQueueDrawer');

    await wrapper.find('[data-testid="queue-card"]').trigger('click');

    expect(openNewQueueDrawerSpy).toHaveBeenCalledWith({
      uuid: 'queue-1',
      name: 'Queue 1',
      agents: 5,
    });
  });
});
