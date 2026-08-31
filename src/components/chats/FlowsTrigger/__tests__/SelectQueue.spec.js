import { flushPromises, mount } from '@vue/test-utils';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import { useProfile } from '@/store/modules/profile';

import SelectQueue from '../SelectQueue.vue';

const queuePermissions = [
  { uuid: 'permission-1', queue: 'queue-1', queue_name: 'Queue 1' },
  { uuid: 'permission-2', queue: 'queue-2', queue_name: 'Queue 2' },
];

const mountSelectQueue = ({ props = {}, queues = queuePermissions } = {}) => {
  const pinia = createTestingPinia({
    initialState: { profile: { me: { email: 'user@weni.ai', queues } } },
  });

  return mount(SelectQueue, {
    props: { modelValue: '', ...props },
    global: { plugins: [pinia] },
  });
};

describe('SelectQueue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mountSelectQueue();
  });

  it('renders with the correct initial state', () => {
    expect(
      wrapper.find('[data-testid="select-queue-container"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="select-queue-input"]').exists()).toBe(
      true,
    );
  });

  it('maps the profile queues into options using queue and queue_name', () => {
    const select = wrapper.findComponent('[data-testid="select-queue-input"]');

    expect(select.props('options')).toEqual([
      { value: 'queue-1', label: 'Queue 1' },
      { value: 'queue-2', label: 'Queue 2' },
    ]);
  });

  it('emits update:modelValue with the queue identifier when a queue is selected', async () => {
    const select = wrapper.findComponent('[data-testid="select-queue-input"]');

    await select.vm.$emit('update:modelValue', {
      value: 'queue-2',
      label: 'Queue 2',
    });
    await flushPromises();

    const emissions = wrapper.emitted('update:modelValue');
    expect(emissions[emissions.length - 1]).toEqual(['queue-2']);
  });

  it('syncs the selection from modelValue', async () => {
    await wrapper.setProps({ modelValue: 'queue-1' });
    await flushPromises();

    const select = wrapper.findComponent('[data-testid="select-queue-input"]');
    expect(select.props('modelValue')).toEqual({
      value: 'queue-1',
      label: 'Queue 1',
    });
  });

  it('does not fetch queues when the profile already has them', async () => {
    await flushPromises();
    const profileStore = useProfile();

    expect(profileStore.getMeQueues).not.toHaveBeenCalled();
  });

  it('fetches queues on mount when the profile has none', async () => {
    const emptyWrapper = mountSelectQueue({ queues: [] });
    await flushPromises();

    const profileStore = useProfile();
    expect(profileStore.getMeQueues).toHaveBeenCalledTimes(1);

    emptyWrapper.unmount();
  });
});
