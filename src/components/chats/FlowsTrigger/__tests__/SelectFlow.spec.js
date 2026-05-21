import { flushPromises, mount } from '@vue/test-utils';
import { expect, describe, it, vi, beforeEach } from 'vitest';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

import SelectFlow from '../SelectFlow.vue';

vi.mock('@/services/api/resources/chats/flowsTrigger', () => ({
  default: {
    getFlows: vi.fn(() =>
      Promise.resolve([{ uuid: 'flow-1', name: 'Flow 1' }]),
    ),
  },
}));

describe('SelectFlow', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mount(SelectFlow, { props: { modelValue: '' } });
  });

  it('renders with the correct initial state', () => {
    expect(wrapper.find('[data-testid="select-flow-container"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="select-flow-input"]').exists()).toBe(
      true,
    );
  });

  it('fetches flows on mount and populates options', async () => {
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledTimes(1);

    const selectOptions = wrapper.vm.templates;
    expect(selectOptions).toEqual([{ value: 'flow-1', label: 'Flow 1' }]);
  });

  it('calls getFlows with verify_chats_tag=true by default', async () => {
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledWith(undefined, {
      verify_chats_tag: true,
    });
  });

  it('calls getFlows with verify_chats_tag=false when disableGetChatsTag prop is true', async () => {
    const customWrapper = mount(SelectFlow, {
      props: { modelValue: '', disableGetChatsTag: true },
    });
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledWith(undefined, {
      verify_chats_tag: false,
    });

    customWrapper.unmount();
  });

  it('does not fetch flows on mount when isDisabled is true', async () => {
    vi.clearAllMocks();

    const disabledWrapper = mount(SelectFlow, {
      props: { modelValue: '', isDisabled: true },
    });
    await flushPromises();

    expect(FlowsTrigger.getFlows).not.toHaveBeenCalled();
    expect(disabledWrapper.vm.templates).toEqual([]);

    disabledWrapper.unmount();
  });

  it('refetches flows with the new projectUuidFlow when the prop changes', async () => {
    await flushPromises();
    FlowsTrigger.getFlows.mockClear();

    await wrapper.setProps({ projectUuidFlow: 'project-uuid-1' });
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledWith('project-uuid-1', {
      verify_chats_tag: true,
    });
  });

  it('clears selection and emits empty modelValue when projectUuidFlow changes', async () => {
    await flushPromises();
    FlowsTrigger.getFlows.mockClear();

    await wrapper.setProps({ projectUuidFlow: 'project-uuid-1' });
    await flushPromises();

    expect(wrapper.vm.flowSelection).toBeNull();
    expect(wrapper.emitted('update:modelValue')).toContainEqual(['']);
  });

  it('emits update:modelValue when a flow is selected', async () => {
    await flushPromises();

    await wrapper.setData({
      flowSelection: { value: 'flow-1', label: 'Flow 1' },
    });
    await wrapper.vm.$nextTick();

    const emissions = wrapper.emitted('update:modelValue');
    expect(emissions[emissions.length - 1]).toEqual(['flow-1']);
  });

  it('syncs flowSelection from modelValue after templates load', async () => {
    const syncedWrapper = mount(SelectFlow, {
      props: { modelValue: 'flow-1' },
    });
    await flushPromises();

    expect(syncedWrapper.vm.flowSelection).toEqual({
      value: 'flow-1',
      label: 'Flow 1',
    });

    syncedWrapper.unmount();
  });

  it('clears flowSelection when modelValue is empty', async () => {
    await flushPromises();

    await wrapper.setProps({ modelValue: 'flow-1' });
    await flushPromises();
    expect(wrapper.vm.flowSelection).toEqual({
      value: 'flow-1',
      label: 'Flow 1',
    });

    await wrapper.setProps({ modelValue: '' });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.flowSelection).toBeNull();
  });

  it('clears flowSelection when modelValue does not match any template', async () => {
    const unknownWrapper = mount(SelectFlow, {
      props: { modelValue: 'unknown-flow' },
    });
    await flushPromises();

    expect(unknownWrapper.vm.flowSelection).toBeNull();

    unknownWrapper.unmount();
  });

  it('handles API errors gracefully', async () => {
    FlowsTrigger.getFlows.mockRejectedValueOnce(new Error('API Error'));
    const consoleLogSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const errorWrapper = mount(SelectFlow, {
      props: { modelValue: '' },
      mocks: { $t: (key) => key },
    });

    await flushPromises();

    expect(errorWrapper.vm.templates).toEqual([]);
    expect(errorWrapper.vm.loadingFlows).toBe(false);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Error getting flows',
      new Error('API Error'),
    );

    consoleLogSpy.mockRestore();
    errorWrapper.unmount();
  });
});
