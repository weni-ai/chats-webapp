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

const dialogStubs = {
  UnnnicDialog: {
    name: 'UnnnicDialogStub',
    props: ['open'],
    template: `
      <div v-if="open" v-bind="$attrs">
        <slot />
      </div>
    `,
  },
  UnnnicDialogContent: {
    name: 'UnnnicDialogContentStub',
    props: ['size'],
    template: '<div><slot /></div>',
  },
  UnnnicDialogHeader: {
    name: 'UnnnicDialogHeaderStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogTitle: {
    name: 'UnnnicDialogTitleStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogFooter: {
    name: 'UnnnicDialogFooterStub',
    template: '<div><slot /></div>',
  },
};

describe('ModalSendFlow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ModalSendFlow, {
      props: { contacts: [{ uuid: '1', name: 'Contact 1' }] },
      global: { stubs: dialogStubs },
    });
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    expect(wrapper.find('[data-testid="modal-send-flow"]').exists()).toBe(true);

    expect(wrapper.find('[data-testid="select-flow"]').exists()).toBe(true);

    expect(wrapper.find('[data-testid="send-flow-button"]').exists()).toBe(
      true,
    );
  });

  it('emits close event when dialog closes (update:open false)', async () => {
    wrapper.vm.isOpen = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('updates selectedFlow when a flow is selected', async () => {
    const selectFlow = wrapper.findComponent('[data-testid="select-flow"]');

    await selectFlow.vm.$emit('update:modelValue', 'flow-uuid-123');

    expect(wrapper.vm.selectedFlow).toBe('flow-uuid-123');
  });

  it('shows success alert and emits send-flow-finished when no errors occur', async () => {
    const sendFlowButton = wrapper.findComponent(
      '[data-testid="send-flow-button"]',
    );
    await sendFlowButton.vm.$emit('send-flow-finished', { hasError: false });

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('flows_trigger.successfully_triggered'),
        type: 'success',
      },
      seconds: 5,
    });

    expect(wrapper.emitted('send-flow-finished')).toHaveLength(1);
  });

  it('shows error alert and emits send-flow-finished when errors occur', async () => {
    const sendFlowButton = wrapper.findComponent(
      '[data-testid="send-flow-button"]',
    );
    await sendFlowButton.vm.$emit('send-flow-finished', { hasError: true });

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('flows_trigger.error_triggering'),
        type: 'error',
      },
      seconds: 5,
    });

    expect(wrapper.emitted('send-flow-finished')).toHaveLength(1);
  });
});
