import { mount } from '@vue/test-utils';
import TextBox from '../TextBox.vue';

function createWrapper(props = {}) {
  const wrapper = mount(TextBox, {
    propsData: {
      send: jest.fn(),
      onKeyDown: jest.fn(),
      ...props,
    },
  });

  return wrapper;
}

describe('TextBox', () => {
  it('should renders the component', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('should displays the placeholder text in the textarea', () => {
    const placeholder = 'Mensagem';
    const wrapper = createWrapper({
      value: '',
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.element.placeholder).toBe(placeholder);
  });

  it('should emits an input event when the textarea value changes', async () => {
    const wrapper = createWrapper();
    const textarea = wrapper.find('textarea');

    textarea.setValue('Hello');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted('input')[0]).toEqual(['Hello']);
  });

  it('should clears the textarea when send message', async () => {
    const wrapper = createWrapper({ value: 'Hello' });
    const textarea = wrapper.find('textarea');

    expect(textarea.element.value).toBe('Hello');

    await textarea.trigger('focus');
    await wrapper.setData({ value: 'Hello World' }); // Simular a entrada de um valor não vazio
    await textarea.trigger('keydown.enter');

    expect(textarea.element.value).toBe('');
  });

  // it('adjusts the textarea height when the content changes', async () => {
  //   const wrapper = createWrapper();
  //   const textarea = wrapper.find('textarea');

  //   const lineHeight = parseFloat(getComputedStyle(textarea.element).lineHeight);
  //   const maxHeight = wrapper.vm.maxTextareaRows * lineHeight;

  //   // Enter enough text to exceed the maximum height
  //   textarea.setValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7');
  //   await wrapper.vm.$nextTick();

  //   expect(textarea.element.style.height).toBe(`${maxHeight}px`);

  //   // Clear the text and check if the height resets
  //   textarea.setValue('');
  //   await wrapper.vm.$nextTick();

  //   expect(textarea.element.style.height).toBe('auto');
  // });

  // it('emits a send event when the send button is clicked', async () => {
  //   const wrapper = createWrapper();
  //   const sendButton = wrapper.find('.actions unnnic-button-icon[type="secondary"]');

  //   sendButton.trigger('click');
  //   await wrapper.vm.$nextTick();

  //   expect(wrapper.emitted('send')).toBeTruthy();
  // });

  // it('does not emit a send event when Shift + Enter is pressed', async () => {
  //   const wrapper = createWrapper();
  //   const textarea = wrapper.find('textarea');

  //   textarea.setValue('Hello');
  //   await wrapper.vm.$nextTick();

  //   expect(wrapper.emitted('send')).toBeFalsy();

  //   textarea.trigger('keydown', { key: 'Enter', shiftKey: true });
  //   await wrapper.vm.$nextTick();

  //   expect(wrapper.emitted('send')).toBeFalsy();
  // });
});
