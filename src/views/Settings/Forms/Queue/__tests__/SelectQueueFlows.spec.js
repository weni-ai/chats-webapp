import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

import SelectQueueFlows from '../SelectQueueFlows.vue';

vi.mock('@/services/api/resources/chats/flowsTrigger', () => ({
  default: {
    getFlows: vi.fn(() =>
      Promise.resolve([
        { uuid: 'flow-1', name: 'Flow 1' },
        { uuid: 'flow-2', name: 'Flow 2' },
      ]),
    ),
  },
}));

describe('SelectQueueFlows', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mount(SelectQueueFlows, {
      props: { modelValue: [] },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          UnnnicSelect: true,
          TagGroup: true,
        },
        mocks: {
          $t: (key) => key,
        },
      },
    });
  });

  it('renders the label with its tooltip', () => {
    const label = wrapper.find('[data-testid="select-queue-flows-label"]');

    expect(label.text()).toContain(
      'config_chats.queues.bond_flows_queue.select.label',
    );
    expect(label.find('[data-testid="tooltip-trigger"]').exists()).toBe(true);
  });

  it('fetches flows on mount', async () => {
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledWith('', {
      verify_chats_tag: true,
    });
    expect(wrapper.vm.flows).toEqual([
      { uuid: 'flow-1', name: 'Flow 1' },
      { uuid: 'flow-2', name: 'Flow 2' },
    ]);
  });

  it('excludes already selected flows from options', async () => {
    await wrapper.setProps({
      modelValue: ['flow-1'],
    });
    await flushPromises();

    expect(wrapper.vm.availableFlowOptions).toEqual([
      { value: 'flow-2', label: 'Flow 2' },
    ]);
  });

  it('adds a selected flow and clears the select', async () => {
    await flushPromises();

    wrapper.vm.flowSelection = 'flow-1';
    await flushPromises();

    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toEqual(['flow-1']);
    expect(wrapper.vm.flowSelection).toBe('');
  });

  it('removes a selected flow by uuid', async () => {
    await wrapper.setProps({
      modelValue: ['flow-1', 'flow-2'],
    });

    wrapper.vm.removeFlow('flow-1');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toEqual(['flow-2']);
  });

  it('resolves flow names for tags from loaded flows', async () => {
    await wrapper.setProps({
      modelValue: ['flow-1'],
    });
    await flushPromises();

    expect(wrapper.vm.selectedFlowTags).toEqual([
      { uuid: 'flow-1', name: 'Flow 1' },
    ]);
  });
});
