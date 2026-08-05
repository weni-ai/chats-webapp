import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';

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

  it('fetches flows on mount', async () => {
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledWith(undefined, {
      verify_chats_tag: true,
    });
    expect(wrapper.vm.flows).toEqual([
      { uuid: 'flow-1', name: 'Flow 1' },
      { uuid: 'flow-2', name: 'Flow 2' },
    ]);
  });

  it('excludes already selected flows from options', async () => {
    await wrapper.setProps({
      modelValue: [{ uuid: 'flow-1', name: 'Flow 1' }],
    });
    await flushPromises();

    expect(wrapper.vm.availableFlowOptions).toEqual([
      { value: 'flow-2', label: 'Flow 2' },
    ]);
  });

  it('adds a selected flow and clears the select', async () => {
    await flushPromises();

    await wrapper.setData({
      flowSelection: 'flow-1',
    });
    await flushPromises();

    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toEqual([
      { uuid: 'flow-1', name: 'Flow 1' },
    ]);
    expect(wrapper.vm.flowSelection).toBe('');
  });

  it('removes a selected flow by uuid', async () => {
    await wrapper.setProps({
      modelValue: [
        { uuid: 'flow-1', name: 'Flow 1' },
        { uuid: 'flow-2', name: 'Flow 2' },
      ],
    });

    wrapper.vm.removeFlow('flow-1');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toEqual([
      { uuid: 'flow-2', name: 'Flow 2' },
    ]);
  });

  it('hydrates flow names when selected flows only have uuids as name', async () => {
    const hydratedWrapper = mount(SelectQueueFlows, {
      props: {
        modelValue: [{ uuid: 'flow-1', name: 'flow-1' }],
      },
      global: {
        stubs: {
          UnnnicSelect: true,
          TagGroup: true,
        },
        mocks: {
          $t: (key) => key,
        },
      },
    });

    await flushPromises();

    expect(hydratedWrapper.emitted('update:modelValue').at(-1)[0]).toEqual([
      { uuid: 'flow-1', name: 'Flow 1' },
    ]);

    hydratedWrapper.unmount();
  });
});
