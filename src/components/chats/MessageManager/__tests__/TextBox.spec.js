import { mount, createLocalVue } from '@vue/test-utils';
import { unnnicButtonIcon } from '@weni/unnnic-system';
import TextBox from '../TextBox.vue';

const localVue = createLocalVue();

function createWrapper(props = {}) {
  const wrapper = mount(TextBox, {
    propsData: {
      send: jest.fn(),
      onKeyDown: jest.fn(),
      ...props,
    },
    stubs: {
      unnnicButtonIcon,
    },
    localVue,
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
    const wrapper = createWrapper();
    const textarea = wrapper.find('textarea');

    textarea.setValue('Hello');
    expect(textarea.element.value).toBe('Hello');

    await wrapper.find('.button-icon.secondary').trigger('click');

    expect(textarea.element.value).toBe('');
  });

  it('should adjusts the textarea height when the content changes', async () => {
    const wrapper = createWrapper();
    const textarea = wrapper.find('textarea');

    await textarea.setValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6');
    expect(textarea.element.style.height).not.toBe('auto');

    await textarea.setValue('');

    expect(textarea.element.style.height).toBe('auto');
  });
});
