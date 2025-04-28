import { mount } from '@vue/test-utils';
import { expect, describe, it, vi, beforeEach } from 'vitest';

import SendFlow from '../SendFlow.vue';
import SelectFlow from '../SelectFlow.vue';
import SendFlowButton from '../SendFlowButton.vue';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

vi.mock('@/utils/callUnnnicAlert');

vi.mock('@/services/api/resources/chats/flowsTrigger', () => ({
  default: {
    getFlows: vi.fn(() =>
      Promise.resolve([{ uuid: 'flow-1', name: 'Flow 1' }]),
    ),
  },
}));

describe('SendFlow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(SendFlow, {
      global: { components: { SelectFlow, SendFlowButton } },
      props: { contacts: [], selectedContact: {} },
    });
    vi.clearAllMocks();
  });

  it('renders correctly with initial state', async () => {
    await wrapper.setProps({ contacts: undefined, selectedContact: undefined });
    expect(wrapper.findComponent('[data-testid="select-flow"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="back-button"]').exists()).toBe(true);
    expect(
      wrapper.findComponent('[data-testid="send-flow-button"]').exists(),
    ).toBe(true);
  });

  it('updates selectedFlow when a flow is selected', async () => {
    const selectFlow = wrapper.findComponent('[data-testid="select-flow"]');
    await selectFlow.vm.$emit('update:modelValue', 'flow-1');
    expect(wrapper.vm.selectedFlow).toBe('flow-1');
  });

  it('shows progress modal when send-flow-started is emitted', async () => {
    const sendFlowButton = wrapper.findComponent(
      '[data-testid="send-flow-button"]',
    );
    await sendFlowButton.vm.$emit('send-flow-started');
    expect(wrapper.vm.showProgressBar).toBe(true);
  });

  it('hides progress modal and shows success alert when send-flow-finished is emitted without errors', async () => {
    const sendFlowButton = wrapper.findComponent(
      '[data-testid="send-flow-button"]',
    );
    wrapper.vm.showProgressBar = true;

    await sendFlowButton.vm.$emit('send-flow-finished', { hasError: false });

    expect(wrapper.vm.showProgressBar).toBe(false);
    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('flows_trigger.successfully_triggered'),
        type: 'success',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('hides progress modal and shows error alert when send-flow-finished is emitted with errors', async () => {
    const sendFlowButton = wrapper.findComponent(
      '[data-testid="send-flow-button"]',
    );
    wrapper.vm.showProgressBar = true;

    await sendFlowButton.vm.$emit('send-flow-finished', { hasError: true });

    expect(wrapper.vm.showProgressBar).toBe(false);
    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('flows_trigger.error_triggering'),
        type: 'error',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits back event when back button is clicked', async () => {
    await wrapper.find('[data-testid="back-button"]').trigger('click');
    expect(wrapper.emitted('back')).toHaveLength(1);
  });
});
