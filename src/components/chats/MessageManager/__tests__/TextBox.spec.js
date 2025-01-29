import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { unnnicButton as UnnnicButton } from '@weni/unnnic-system';
import TextBox from '../TextBox.vue';

import * as isMobile from 'is-mobile';

vi.mock('is-mobile', () => ({ default: vi.fn(() => false) }));

function createWrapper(props = {}) {
  const wrapper = mount(TextBox, {
    propsData: {
      send: vi.fn(),
      onKeyDown: vi.fn(),
      modelValue: '',
      ...props,
    },
    stubs: {
      UnnnicButton,
    },
  });

  return wrapper;
}

describe('TextBox', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should renders the component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should displays the placeholder text in the textarea', () => {
    const placeholder = 'Message';

    const textarea = wrapper.find('[data-testid="text-area"]');
    expect(textarea.element.placeholder).toBe(placeholder);
  });

  it('should emits an input event when the textarea value changes', async () => {
    const textarea = wrapper.find('[data-testid="text-area"]');

    textarea.setValue('Hello');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['Hello']);
  });

  it('calls handleEmojiPicker when emoji button is clicked', async () => {
    const emojiButton = wrapper.find('[data-testid="emoji-button"]');
    const handleEmojiPickerSpy = vi.spyOn(wrapper.vm, 'handleEmojiPicker');

    await emojiButton.trigger('click');

    expect(handleEmojiPickerSpy).toHaveBeenCalled();
  });

  it('toggles emoji picker when emoji button is clicked', async () => {
    expect(wrapper.vm.isEmojiPickerOpen).toBe(false);

    await wrapper.find('[data-testid="emoji-button"]').trigger('click');
    expect(wrapper.vm.isEmojiPickerOpen).toBe(true);

    await wrapper.find('[data-testid="emoji-button"]').trigger('click');
    expect(wrapper.vm.isEmojiPickerOpen).toBe(false);
  });

  it('closes emoji picker when close event is emitted', async () => {
    await wrapper.setData({ isEmojiPickerOpen: true });
    await wrapper.vm.closeEmojiPicker();

    expect(wrapper.vm.isEmojiPickerOpen).toBe(false);
  });

  it('emits handle-quick-messages when quick message button is clicked', async () => {
    vi.spyOn(isMobile, 'default').mockResolvedValueOnce(true);

    const mobileWrapper = createWrapper({ modelValue: 'test' });

    const mobileButton = mobileWrapper.find(
      '[data-testid="mobile-button-quick-message"]',
    );

    await mobileButton.trigger('click');

    expect(mobileWrapper.emitted('handle-quick-messages')).toBeTruthy();
  });

  it('emits keydown event when key is pressed in textarea', async () => {
    const textarea = wrapper.find('[data-testid="text-area"]');
    await textarea.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('keydown')).toBeTruthy();
  });

  it('clears textarea when Enter is pressed without Shift', async () => {
    await wrapper.setProps({ modelValue: 'Test message' });

    const textarea = wrapper.find('[data-testid="text-area"]');
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: false });

    expect(wrapper.vm.message).toBe('');
  });

  it('does not clear textarea when Shift+Enter is pressed', async () => {
    await wrapper.setProps({ modelValue: 'Test message' });

    const textarea = wrapper.find('[data-testid="text-area"]');
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true });

    expect(wrapper.vm.message).toBe('Test message');
  });

  it('focuses textarea when focus method is called', async () => {
    const focusSpy = vi.spyOn(wrapper.vm.$refs.textareaRef, 'focus');
    wrapper.vm.focus();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('emit paste on paste textarea', async () => {
    const textarea = wrapper.find('[data-testid="text-area"]');

    await textarea.trigger('paste', 'text');

    expect(wrapper.emitted('paste')).toBeTruthy();
  });

  it('change focus on textarea focus/blur', async () => {
    const textarea = wrapper.find('[data-testid="text-area"]');

    await textarea.trigger('focus');
    await textarea.trigger('blur');

    expect(wrapper.emitted('is-focused-handler')[0][0]).toBe(true);

    expect(wrapper.emitted('is-focused-handler')[1][0]).toBe(false);
  });
});
