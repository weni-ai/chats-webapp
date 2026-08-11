import { mount, flushPromises } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { nextTick } from 'vue';

import QueueFilter from '../QueueFilter.vue';
import QueueService from '@/services/api/resources/chats/queues';
import { useRooms } from '@/store/modules/chats/rooms';

vi.mock('@/services/api/resources/chats/queues', () => ({
  default: {
    getQueuesToFilter: vi.fn(),
  },
}));

const mockSectorsResponse = {
  sectors: [
    {
      name: 'Sector A',
      queues: [
        {
          uuid: 'queue-uuid-1',
          name: 'Queue One',
          rooms_in_progress: 5,
          rooms_in_awaiting: 2,
        },
        {
          uuid: 'queue-uuid-2',
          name: 'Queue Two',
          rooms_in_progress: 1,
          rooms_in_awaiting: 0,
        },
      ],
    },
    {
      name: 'Sales',
      queues: [
        {
          uuid: 'queue-uuid-3',
          name: 'Support',
          rooms_in_progress: 3,
          rooms_in_awaiting: 10,
        },
      ],
    },
  ],
};

describe('QueueFilter.vue', () => {
  let pinia;
  let wrapper;

  const createWrapper = () => {
    return mount(QueueFilter, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
      },
    });
  };

  const findSearchInput = () => {
    const root = wrapper.find('[data-testid="queue-filter-search-input"]');
    const inner = root.find('input');
    return inner.exists() ? inner : root;
  };

  const openPopoverByTrigger = async () => {
    await wrapper
      .find('[data-testid="queue-filter-trigger-icon"]')
      .trigger('click');
    await flushPromises();
  };

  const findQueueOption = (uuid) => {
    return wrapper.find(`[data-testid="queue-filter-queue-option-${uuid}"]`);
  };

  const queueOptionLabelIncludes = (optionEl, substring) => {
    return optionEl.text().includes(substring);
  };

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    const roomsStore = useRooms();
    roomsStore.activeTab = 'ongoing';
    roomsStore.filterQueues = [];
    roomsStore.selectedOngoingRooms = [];
    roomsStore.selectedWaitingRooms = [];

    vi.mocked(QueueService.getQueuesToFilter).mockResolvedValue(
      mockSectorsResponse,
    );

    wrapper = createWrapper();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it('renders the filter section', () => {
    expect(wrapper.find('[data-testid="queue-filter"]').exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="queue-filter-trigger-icon"]').exists(),
    ).toBe(true);
  });

  it('shows active filter count when filterQueues has items', async () => {
    const roomsStore = useRooms();
    roomsStore.filterQueues = ['queue-uuid-1'];
    await nextTick();

    expect(
      wrapper.find('[data-testid="queue-filter-trigger-icon"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="queue-filter-count"]').text()).toBe(
      '(1)',
    );
  });

  it('shows close icon when filter is active and clears store on click', async () => {
    const roomsStore = useRooms();
    roomsStore.filterQueues = ['queue-uuid-1'];
    roomsStore.selectedOngoingRooms = ['r1'];
    roomsStore.selectedWaitingRooms = ['r2'];
    await nextTick();

    const closeIcon = wrapper.find('[data-testid="queue-filter-close-icon"]');
    expect(closeIcon.exists()).toBe(true);
    await closeIcon.trigger('click');

    expect(roomsStore.filterQueues).toEqual([]);
    expect(roomsStore.selectedOngoingRooms).toEqual([]);
    expect(roomsStore.selectedWaitingRooms).toEqual([]);
  });

  it('fetches queues when popover opens and renders checkboxes', async () => {
    await openPopoverByTrigger();

    expect(QueueService.getQueuesToFilter).toHaveBeenCalledTimes(1);

    const options = wrapper.findAll(
      '[data-testid^="queue-filter-queue-option"]',
    );
    expect(options).toHaveLength(3);
    expect(queueOptionLabelIncludes(options[0], 'Sector A')).toBe(true);
    expect(queueOptionLabelIncludes(options[0], 'Queue One')).toBe(true);
  });

  it('uses rooms_in_awaiting counts when activeTab is waiting', async () => {
    const roomsStore = useRooms();
    roomsStore.activeTab = 'waiting';
    await nextTick();

    await openPopoverByTrigger();

    const options = wrapper.findAll(
      '[data-testid^="queue-filter-queue-option"]',
    );
    const firstText = options[0].text();
    expect(firstText).toContain('2');
  });

  it('shows loading state while queues are loading', async () => {
    let resolveRequest;
    vi.mocked(QueueService.getQueuesToFilter).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const openPromise = openPopoverByTrigger();
    await nextTick();

    expect(wrapper.find('[data-testid="queue-filter-loading"]').exists()).toBe(
      true,
    );

    resolveRequest(mockSectorsResponse);
    await openPromise;
    await flushPromises();

    expect(wrapper.find('[data-testid="queue-filter-loading"]').exists()).toBe(
      false,
    );
  });

  it('filters queue options by search text', async () => {
    await openPopoverByTrigger();

    await findSearchInput().setValue('Support');

    const options = wrapper.findAll(
      '[data-testid^="queue-filter-queue-option"]',
    );
    expect(options).toHaveLength(1);
    expect(queueOptionLabelIncludes(options[0], 'Support')).toBe(true);
  });

  it('applies selected queues to the store and clears room selection', async () => {
    const roomsStore = useRooms();
    roomsStore.selectedOngoingRooms = ['room-a'];
    roomsStore.selectedWaitingRooms = ['room-b'];

    await openPopoverByTrigger();

    await findQueueOption('queue-uuid-1')
      .find('input[type="checkbox"]')
      .setValue(true);
    await findQueueOption('queue-uuid-3')
      .find('input[type="checkbox"]')
      .setValue(true);

    await wrapper
      .find('[data-testid="queue-filter-apply-button"]')
      .trigger('click');

    expect(roomsStore.filterQueues).toEqual(['queue-uuid-1', 'queue-uuid-3']);
    expect(roomsStore.selectedOngoingRooms).toEqual([]);
    expect(roomsStore.selectedWaitingRooms).toEqual([]);
  });

  it('disables apply when no queue is selected', async () => {
    await openPopoverByTrigger();

    const applyBtn = wrapper.find('[data-testid="queue-filter-apply-button"]');
    expect(applyBtn.attributes('disabled')).toBeDefined();
  });

  it('clears selection via footer button without applying filter', async () => {
    const roomsStore = useRooms();
    roomsStore.selectedOngoingRooms = ['x'];
    roomsStore.selectedWaitingRooms = ['y'];

    await openPopoverByTrigger();

    await findQueueOption('queue-uuid-1')
      .find('input[type="checkbox"]')
      .setValue(true);

    await wrapper
      .find('[data-testid="queue-filter-clear-button"]')
      .trigger('click');

    expect(roomsStore.filterQueues).toEqual([]);
    expect(roomsStore.selectedOngoingRooms).toEqual([]);
    expect(roomsStore.selectedWaitingRooms).toEqual([]);
  });

  it('prefills selected queues from filterQueues when opening popover', async () => {
    const roomsStore = useRooms();
    roomsStore.filterQueues = ['queue-uuid-2'];

    await openPopoverByTrigger();

    const queueTwoInput = findQueueOption('queue-uuid-2').find(
      'input[type="checkbox"]',
    );
    expect(queueTwoInput.element.checked).toBe(true);
  });

  it('resets search and local selection when popover closes', async () => {
    await openPopoverByTrigger();

    await findSearchInput().setValue('Sales');

    await wrapper
      .find('[data-testid="queue-filter-trigger-icon"]')
      .trigger('click');
    await nextTick();
    await flushPromises();

    await openPopoverByTrigger();

    expect(findSearchInput().element.value).toBe('');
  });

  it('handles API error without leaving loading stuck', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(QueueService.getQueuesToFilter).mockRejectedValueOnce(
      new Error('network'),
    );

    await openPopoverByTrigger();

    expect(wrapper.find('[data-testid="queue-filter-loading"]').exists()).toBe(
      false,
    );
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
