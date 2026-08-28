import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import SelectFilters from '../SelectFilters.vue';
import QueueService from '@/services/api/resources/settings/queue';
import ProjectService from '@/services/api/resources/settings/project';

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    listByProject: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    agents: vi.fn(),
  },
}));

describe('SelectFilters', () => {
  let wrapper;

  const queues = [
    { uuid: 'queue-1', name: 'Support', sector_name: 'Sales' },
    { uuid: 'queue-2', name: 'Billing', sector_name: 'Finance' },
  ];

  const representatives = [
    {
      user: {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@test.com',
      },
    },
    {
      user: {
        first_name: '',
        last_name: '',
        email: 'noname@test.com',
      },
    },
  ];

  const createWrapper = (props = {}) =>
    mount(SelectFilters, {
      props: {
        queues: ['all'],
        representatives: ['all'],
        ...props,
      },
    });

  beforeEach(() => {
    vi.clearAllMocks();
    QueueService.listByProject.mockResolvedValue({
      results: queues,
      next: null,
    });
    ProjectService.agents.mockResolvedValue({
      results: representatives,
      next: null,
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should fetch queues and representatives on mount', async () => {
    wrapper = createWrapper();
    await flushPromises();

    expect(QueueService.listByProject).toHaveBeenCalledWith({
      limit: 100,
      offset: 0,
    });
    expect(ProjectService.agents).toHaveBeenCalledWith(0, 100);
  });

  it('should paginate queues and representatives while next exists', async () => {
    QueueService.listByProject
      .mockResolvedValueOnce({
        results: [queues[0]],
        next: 'next-page',
      })
      .mockResolvedValueOnce({
        results: [queues[1]],
        next: null,
      });
    ProjectService.agents
      .mockResolvedValueOnce({
        results: [representatives[0]],
        next: 'next-page',
      })
      .mockResolvedValueOnce({
        results: [representatives[1]],
        next: null,
      });

    wrapper = createWrapper();
    await flushPromises();

    expect(QueueService.listByProject).toHaveBeenCalledTimes(2);
    expect(ProjectService.agents).toHaveBeenCalledTimes(2);
    expect(wrapper.vm.queuesList).toHaveLength(2);
    expect(wrapper.vm.representativesList).toHaveLength(2);
  });

  it('should build queue options with all option and disable others when all is selected', async () => {
    wrapper = createWrapper({ queues: ['all'] });
    await flushPromises();

    const options = wrapper.vm.queuesOptions;
    expect(options[0].value).toBe('all');
    expect(options[1]).toMatchObject({
      value: 'queue-1',
      disabled: true,
    });
    expect(options[1].label).toContain('Support');
  });

  it('should use email as representative label when name is empty', async () => {
    wrapper = createWrapper({ representatives: [] });
    await flushPromises();

    const options = wrapper.vm.representativesOptions;
    expect(options[1].label).toBe('Jane Doe');
    expect(options[2].label).toBe('noname@test.com');
  });

  it('should emit only all when queues include all', async () => {
    wrapper = createWrapper({ queues: [] });
    await flushPromises();

    const queuesSelect = wrapper.findComponent(
      '[data-testid="select-filters-queues"]',
    );
    await queuesSelect.vm.$emit('update:model-value', ['all', 'queue-1']);

    expect(wrapper.emitted('update:queues')[0][0]).toEqual(['all']);
  });

  it('should emit selected representatives when all is not included', async () => {
    wrapper = createWrapper({ representatives: [] });
    await flushPromises();

    const representativesSelect = wrapper.findComponent(
      '[data-testid="select-filters-representatives"]',
    );
    await representativesSelect.vm.$emit('update:model-value', [
      'jane@test.com',
    ]);

    expect(wrapper.emitted('update:representatives')[0][0]).toEqual([
      'jane@test.com',
    ]);
  });

  it('should set placeholders indicating at least one selection is required', async () => {
    wrapper = createWrapper();
    await flushPromises();

    const queuesSelect = wrapper.findComponent(
      '[data-testid="select-filters-queues"]',
    );
    const representativesSelect = wrapper.findComponent(
      '[data-testid="select-filters-representatives"]',
    );

    expect(queuesSelect.props('placeholder')).toBe(
      'Select at least one queue',
    );
    expect(representativesSelect.props('placeholder')).toBe(
      'Select at least one representative',
    );
  });
});
