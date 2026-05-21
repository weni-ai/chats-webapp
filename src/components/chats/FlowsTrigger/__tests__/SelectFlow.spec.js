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

    expect(FlowsTrigger.getFlows).toHaveBeenCalled();

    const selectOptions = wrapper.vm.templates;
    expect(selectOptions).toEqual([{ value: 'flow-1', label: 'Flow 1' }]);
  });

  it('calls getFlows with verify_chats_tag=false by default', async () => {
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledWith(undefined, {
      verify_chats_tag: false,
    });
  });

  it('calls getFlows with verify_chats_tag=true when disableGetChatsTag prop is true', async () => {
    FlowsTrigger.getFlows.mockClear();

    const customWrapper = mount(SelectFlow, {
      props: { modelValue: '', disableGetChatsTag: true },
    });
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledWith(undefined, {
      verify_chats_tag: true,
    });

    customWrapper.unmount();
  });

  it('refetches flows with the new projectUuidFlow when the prop changes', async () => {
    await flushPromises();
    FlowsTrigger.getFlows.mockClear();

    await wrapper.setProps({ projectUuidFlow: 'project-uuid-1' });
    await flushPromises();

    expect(FlowsTrigger.getFlows).toHaveBeenCalledWith('project-uuid-1', {
      verify_chats_tag: false,
    });
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

  it('handles API errors gracefully', async () => {
    FlowsTrigger.getFlows.mockRejectedValueOnce(new Error('API Error'));
    const consoleLogSpy = vi.spyOn(console, 'error');

    const errorWrapper = mount(SelectFlow, {
      props: { modelValue: '' },
      mocks: { $t: (key) => key },
    });

    await flushPromises();

    expect(errorWrapper.vm.templates).toEqual([]);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Error getting flows',
      new Error('API Error'),
    );
  });
});
