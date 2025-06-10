import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import QuickMessageForm from '../QuickMessageForm.vue';

const createWrapper = (props = {}) => {
  return mount(QuickMessageForm, {
    props: {
      modelValue: { title: '', shortcut: '', text: '' },
      ...props,
    },
  });
};

describe('QuickMessageForm.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });
  it('renders properly', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('emits update:model-value when title is changed', async () => {
    const input = wrapper.findComponent('[data-testid="title-input"]');
    await input.setValue('New Title');
    expect(wrapper.emitted('update:model-value')).toBeTruthy();
  });

  it('emits update:model-value when shortcut is changed', async () => {
    const input = wrapper.findComponent('[data-testid="shortcut-input"]');
    await input.setValue('/shortcut');
    expect(wrapper.emitted('update:model-value')).toBeTruthy();
  });

  it('emits update:model-value when message text is changed', async () => {
    const textarea = wrapper.findComponent('[data-testid="message-input"]');
    await textarea.setValue('Quick message text');
    expect(wrapper.emitted('update:model-value')).toBeTruthy();
  });

  it('emits submit when save button is clicked', async () => {
    await wrapper.setProps({
      modelValue: { title: 'Title', shortcut: '/sc', text: 'Message' },
    });

    const button = wrapper.find('[data-testid="save-button"]');
    await button.trigger('click');
    expect(wrapper.emitted('submit')).toBeTruthy();
  });

  it('disables save button when required fields are empty', () => {
    const button = wrapper.findComponent('[data-testid="save-button"]');
    expect(button.props().disabled).toBe(true);
  });

  it('enables save button when all required fields are filled', async () => {
    await wrapper.setProps({
      modelValue: { title: 'Title', shortcut: '/sc', text: 'Message' },
    });
    const button = wrapper.findComponent('[data-testid="save-button"]');
    expect(button.props().disabled).toBe(false);
  });

  it('emits cancel when cancel button is clicked', async () => {
    const button = wrapper.find('[data-testid="cancel-button"]');
    await button.trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('emits cancel when on call cancel()', async () => {
    wrapper.vm.cancel();
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
