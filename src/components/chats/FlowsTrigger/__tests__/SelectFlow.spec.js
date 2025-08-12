import { mount } from '@vue/test-utils';
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
    expect(
      wrapper.findComponent('[data-testid="select-flow-input"]').exists(),
    ).toBe(true);
  });

  it('fetches flows on mount and populates options', async () => {
    await wrapper.vm.$nextTick();
    expect(FlowsTrigger.getFlows).toHaveBeenCalled();

    const selectOptions = wrapper.vm.templates;
    expect(selectOptions).toEqual([
      { value: '', label: wrapper.vm.$t('search_or_select') },
      { value: 'flow-1', label: 'Flow 1' },
    ]);
  });

  it('emits update:modelValue when a flow is selected', async () => {
    await wrapper.setData({
      templates: [
        { value: '', label: wrapper.vm.$t('search_or_select') },
        { value: 'flow-1', label: 'Flow 1' },
      ],
      flowUuid: [{ value: 'flow-1', label: 'Flow 1' }],
    });

    await wrapper.vm.getFlowTrigger('flow-1');

    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['flow-1']);
  });

  it('handles API errors gracefully', async () => {
    FlowsTrigger.getFlows.mockRejectedValueOnce(new Error('API Error'));
    const consoleLogSpy = vi.spyOn(console, 'error');

    const wrapper = mount(SelectFlow, {
      props: { modelValue: '' },
      mocks: { $t: (key) => key },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.loadingFlows).toBe(false);
    expect(wrapper.vm.templates).toEqual([
      { value: '', label: wrapper.vm.$t('search_or_select') },
    ]);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Error getting flows',
      new Error('API Error'),
    );
  });
});
