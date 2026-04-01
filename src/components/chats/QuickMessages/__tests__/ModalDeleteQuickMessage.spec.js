import { config, mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import i18n from '@/plugins/i18n';
import ModalDeleteQuickMessage from '../ModalDeleteQuickMessage.vue';

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const quickMessageFixture = {
  uuid: 'qm-1',
  shortcut: 'bye',
  text: 'Goodbye text',
};

const UnnnicModalDialogStub = {
  name: 'UnnnicModalDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    primaryButtonProps: { type: Object, default: () => ({}) },
    secondaryButtonProps: { type: Object, default: () => ({}) },
    type: { type: String, default: '' },
    showCloseIcon: { type: Boolean, default: false },
  },
  emits: [
    'primary-button-click',
    'secondary-button-click',
    'close',
    'update:model-value',
  ],
  template: `
    <div data-testid="modal-delete-quick-message-root">
      <h2 data-testid="modal-delete-quick-message-title">{{ title }}</h2>
      <slot />
      <button
        type="button"
        data-testid="modal-delete-primary"
        :disabled="primaryButtonProps?.loading"
        @click="$emit('primary-button-click')"
      >
        {{ primaryButtonProps?.text }}
      </button>
      <button
        type="button"
        data-testid="modal-delete-secondary"
        :disabled="secondaryButtonProps?.disabled"
        @click="$emit('secondary-button-click')"
      >
        {{ secondaryButtonProps?.text }}
      </button>
      <button
        type="button"
        data-testid="modal-delete-dismiss"
        @click="$emit('close')"
      />
    </div>
  `,
};

const mockT = (key, params) => {
  if (key === 'quick_messages.delete_your_quick_message') {
    return 'Delete your quick message';
  }
  if (key === 'delete') {
    return 'Delete';
  }
  if (key === 'cancel') {
    return 'Cancel';
  }
  if (key === 'quick_messages.delete_description' && params?.shortcut) {
    return `Sure to delete ${params.shortcut}?`;
  }
  return key;
};

const createWrapper = (props = {}) =>
  mount(ModalDeleteQuickMessage, {
    props: {
      quickMessage: quickMessageFixture,
      ...props,
    },
    global: {
      mocks: {
        $t: mockT,
      },
      stubs: {
        UnnnicModalDialog: UnnnicModalDialogStub,
      },
    },
  });

describe('ModalDeleteQuickMessage.vue', () => {
  it('renders the modal with the delete title', () => {
    const wrapper = createWrapper();
    expect(
      wrapper.find('[data-testid="modal-delete-quick-message-root"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="modal-delete-quick-message-title"]').text(),
    ).toBe('Delete your quick message');
  });

  it('renders the description with the shortcut from quickMessage', () => {
    const wrapper = createWrapper();
    const paragraph = wrapper.find(
      '[data-testid="modal-delete-quick-message-description"]',
    );
    expect(paragraph.exists()).toBe(true);
    expect(paragraph.text()).toBe('Sure to delete /bye?');
  });

  it('passes loading and disabled flags to button props when isLoading is true', () => {
    const wrapper = createWrapper({ isLoading: true });
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    expect(modal.props('primaryButtonProps').loading).toBe(true);
    expect(modal.props('secondaryButtonProps').disabled).toBe(true);
  });

  it('does not set loading on primary when isLoading is false', () => {
    const wrapper = createWrapper({ isLoading: false });
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    expect(modal.props('primaryButtonProps').loading).toBe(false);
    expect(modal.props('secondaryButtonProps').disabled).toBe(false);
  });

  it('emits confirm when the primary button is clicked', async () => {
    const wrapper = createWrapper();
    await wrapper.find('[data-testid="modal-delete-primary"]').trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('emits close when the secondary button is clicked', async () => {
    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="modal-delete-secondary"]')
      .trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close when the modal emits close', async () => {
    const wrapper = createWrapper();
    await wrapper.find('[data-testid="modal-delete-dismiss"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close when the modal emits update:model-value', async () => {
    const wrapper = createWrapper();
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    await modal.vm.$emit('update:model-value', false);
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
