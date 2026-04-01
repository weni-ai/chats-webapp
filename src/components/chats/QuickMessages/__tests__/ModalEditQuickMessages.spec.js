import { config, mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import i18n from '@/plugins/i18n';
import ModalEditQuickMessages from '../ModalEditQuickMessages.vue';

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

const quickMessageValid = {
  uuid: 'qm-1',
  shortcut: 'hi',
  text: 'Hello text',
};

const UnnnicModalDialogStub = {
  name: 'UnnnicModalDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    size: { type: String, default: '' },
    showCloseIcon: { type: Boolean, default: false },
    primaryButtonProps: { type: Object, default: () => ({}) },
    secondaryButtonProps: { type: Object, default: () => ({}) },
  },
  emits: [
    'primary-button-click',
    'secondary-button-click',
    'close',
    'update:model-value',
  ],
  template: `
    <div data-testid="modal-edit-quick-messages-root">
      <h2 data-testid="modal-edit-quick-messages-title">{{ title }}</h2>
      <slot />
      <button
        type="button"
        data-testid="modal-edit-primary"
        :disabled="primaryButtonProps?.disabled"
        @click="$emit('primary-button-click')"
      >
        {{ primaryButtonProps?.text }}
      </button>
      <button
        type="button"
        data-testid="modal-edit-secondary"
        :disabled="secondaryButtonProps?.disabled"
        @click="$emit('secondary-button-click')"
      >
        {{ secondaryButtonProps?.text }}
      </button>
      <button
        type="button"
        data-testid="modal-edit-dismiss"
        @click="$emit('close')"
      />
    </div>
  `,
};

const MessageFormStub = {
  name: 'MessageForm',
  props: ['modelValue'],
  emits: ['update:model-value'],
  template: '<div data-testid="modal-edit-quick-messages-form" />',
};

const mockT = (key) => {
  if (key === 'save') {
    return 'Save';
  }
  if (key === 'cancel') {
    return 'Cancel';
  }
  return key;
};

const createWrapper = (props = {}) =>
  mount(ModalEditQuickMessages, {
    props: {
      quickMessage: quickMessageValid,
      title: 'Edit quick message',
      ...props,
    },
    global: {
      mocks: {
        $t: mockT,
      },
      stubs: {
        UnnnicModalDialog: UnnnicModalDialogStub,
        MessageForm: MessageFormStub,
      },
    },
  });

describe('ModalEditQuickMessages.vue', () => {
  it('renders the modal with the title prop', () => {
    const wrapper = createWrapper({ title: 'My modal title' });
    expect(
      wrapper.find('[data-testid="modal-edit-quick-messages-root"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="modal-edit-quick-messages-title"]').text(),
    ).toBe('My modal title');
  });

  it('passes size lg and showCloseIcon to the modal', () => {
    const wrapper = createWrapper();
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    expect(modal.props('size')).toBe('lg');
    expect(modal.props('showCloseIcon')).toBe(true);
  });

  it('forwards quickMessage to MessageForm as modelValue', () => {
    const wrapper = createWrapper();
    const form = wrapper.findComponent(MessageFormStub);
    expect(form.props('modelValue')).toEqual(quickMessageValid);
  });

  it('disables the primary button when the form is invalid (empty shortcut)', () => {
    const wrapper = createWrapper({
      quickMessage: { ...quickMessageValid, shortcut: '', text: 'ok' },
    });
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    expect(modal.props('primaryButtonProps').disabled).toBe(true);
  });

  it('disables the primary button when the form is invalid (whitespace shortcut)', () => {
    const wrapper = createWrapper({
      quickMessage: { ...quickMessageValid, shortcut: '   ', text: 'ok' },
    });
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    expect(modal.props('primaryButtonProps').disabled).toBe(true);
  });

  it('disables the primary button when the form is invalid (empty text)', () => {
    const wrapper = createWrapper({
      quickMessage: { ...quickMessageValid, shortcut: 'ok', text: '' },
    });
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    expect(modal.props('primaryButtonProps').disabled).toBe(true);
  });

  it('enables the primary button when shortcut and text are filled', () => {
    const wrapper = createWrapper();
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    expect(modal.props('primaryButtonProps').disabled).toBe(false);
  });

  it('passes loading to primary and disables secondary when isLoading is true', () => {
    const wrapper = createWrapper({ isLoading: true });
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    expect(modal.props('primaryButtonProps').loading).toBe(true);
    expect(modal.props('secondaryButtonProps').disabled).toBe(true);
  });

  it('emits save when the primary button is clicked', async () => {
    const wrapper = createWrapper();
    await wrapper.find('[data-testid="modal-edit-primary"]').trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')).toHaveLength(1);
  });

  it('emits close when the secondary button is clicked', async () => {
    const wrapper = createWrapper();
    await wrapper.find('[data-testid="modal-edit-secondary"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close when the modal emits close', async () => {
    const wrapper = createWrapper();
    await wrapper.find('[data-testid="modal-edit-dismiss"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close when the modal emits update:model-value', async () => {
    const wrapper = createWrapper();
    const modal = wrapper.findComponent(UnnnicModalDialogStub);
    await modal.vm.$emit('update:model-value', false);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits update:quickMessage when MessageForm updates the model', async () => {
    const wrapper = createWrapper();
    const form = wrapper.findComponent(MessageFormStub);
    const next = { ...quickMessageValid, text: 'Updated body' };
    await form.vm.$emit('update:model-value', next);
    expect(wrapper.emitted('update:quickMessage')).toBeTruthy();
    expect(wrapper.emitted('update:quickMessage')[0][0]).toEqual(next);
  });
});
