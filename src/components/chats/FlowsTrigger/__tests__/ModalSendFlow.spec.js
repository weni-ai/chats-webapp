import { mount } from '@vue/test-utils';
import { expect, describe, it, beforeEach, vi } from 'vitest';

import ModalSendFlow from '../ModalSendFlow.vue';

import callUnnnicAlert from '@/utils/callUnnnicAlert';
vi.mock('@/utils/callUnnnicAlert');

vi.mock('@/services/api/resources/chats/flowsTrigger', () => ({
  default: {
    getFlows: vi.fn(() =>
      Promise.resolve([{ uuid: 'flow-1', name: 'Flow 1' }]),
    ),
  },
}));

describe('ModalSendFlow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ModalSendFlow, {
      props: { contacts: [{ uuid: '1', name: 'Contact 1' }] },
    });
  });

  it('renders correctly', () => {
    expect(
      wrapper.findComponent('[data-testid="modal-send-flow"]').exists(),
    ).toBe(true);

    expect(wrapper.findComponent('[data-testid="select-flow"]').exists()).toBe(
      true,
    );

    expect(
      wrapper.findComponent('[data-testid="send-flow-button"]').exists(),
    ).toBe(true);
  });

  it('emits close event when modal is closed', async () => {
    const modal = wrapper.findComponent('[data-testid="modal-send-flow"]');
    await modal.vm.$emit('close');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('updates selectedFlow when a flow is selected', async () => {
    const selectFlow = wrapper.findComponent('[data-testid="select-flow"]');

    await selectFlow.vm.$emit('update:modelValue', 'flow-uuid-123');

    expect(wrapper.vm.selectedFlow).toBe('flow-uuid-123');
  });

  it('shows success alert and emits send-flow-finished after sending flow', async () => {
    const sendFlowButton = wrapper.findComponent(
      '[data-testid="send-flow-button"]',
    );
    await sendFlowButton.vm.$emit('send-flow-finished');

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('flows_trigger.successfully_triggered'),
        type: 'success',
      },
      seconds: 5,
    });

    expect(wrapper.emitted('send-flow-finished')).toHaveLength(1);
  });
});
