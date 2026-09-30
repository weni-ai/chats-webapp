import { mount } from '@vue/test-utils';

import CustomField from '../ContactInfo/CustomField.vue';
import defaultProps from './mocks/customFieldMock.js';

function createWrapper(propsData) {
  const wrapper = mount(CustomField, {
    propsData,
    global: {
      stubs: {
        CopyValueButton: true,
      },
    },
  });

  return wrapper;
}

describe('CustomField', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper(defaultProps);
  });

  it('should renders the title and description', () => {
    expect(wrapper.find('.title').text()).toBe(`${defaultProps.title}:`);
    expect(wrapper.find('.description h4').text()).toBe(
      defaultProps.description,
    );
  });

  it('should show a anchor with target="_blank" if description is a url and is not editable', () => {
    const wrapperWithURL = createWrapper({
      ...defaultProps,
      description: 'https://example.com',
      isEditable: false,
    });

    const anchorElement = wrapperWithURL.find('.description a');
    expect(anchorElement.exists()).toBe(true);
    expect(anchorElement.attributes().href).toBe('https://example.com');
    expect(anchorElement.attributes().target).toBe('_blank');

    wrapperWithURL.unmount();
  });

  it('should shows the textarea field when isCurrent prop is true', async () => {
    await wrapper.setProps({ isCurrent: true });
    expect(wrapper.find('textarea').isVisible()).toBe(true);
  });

  it('should hides the textarea field when isCurrent prop is false', async () => {
    await wrapper.setProps({ isCurrent: false });
    expect(wrapper.find('textarea').isVisible()).toBe(false);
  });

  it('should emits "update-current-custom-field" event on h4 click', async () => {
    const h4 = wrapper.find('.description h4');
    await h4.trigger('click');
    expect(wrapper.emitted('update-current-custom-field')).toBeTruthy();
    expect(wrapper.emitted('update-current-custom-field')[0][0]).toEqual({
      key: defaultProps.title,
      value: defaultProps.description,
    });
  });

  it('should emits "update-current-custom-field" event on textarea value change', async () => {
    const textarea = wrapper.find('textarea');
    await textarea.setValue('New Description');
    expect(wrapper.emitted('update-current-custom-field')).toBeTruthy();
    expect(wrapper.emitted('update-current-custom-field')[0][0]).toEqual({
      key: defaultProps.title,
      value: 'New Description',
    });
  });

  it('should emits "save-value" event on textarea blur', async () => {
    const textarea = wrapper.find('textarea');
    await textarea.trigger('blur');
    expect(wrapper.emitted('save-value')).toBeTruthy();
  });

  it('should emits "save-value" event on textarea enter keydown', async () => {
    const textarea = wrapper.find('textarea');
    await textarea.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('save-value')).toBeTruthy();
  });

  it('should not show the description text (h4) while editing', async () => {
    expect(wrapper.find('.description h4').exists()).toBe(true);

    await wrapper.setProps({ isCurrent: true });

    expect(wrapper.find('.description h4').exists()).toBe(false);
    expect(wrapper.find('textarea').isVisible()).toBe(true);
  });

  it('should restore the description text (h4) after exiting edit mode', async () => {
    await wrapper.setProps({ isCurrent: true });
    expect(wrapper.find('.description h4').exists()).toBe(false);

    await wrapper.setProps({ isCurrent: false });
    expect(wrapper.find('.description h4').exists()).toBe(true);
    expect(wrapper.find('.description h4').text()).toBe(
      defaultProps.description,
    );
  });

  it('should not render the h4 tooltip when isEditable is false and description is a URL', () => {
    const wrapperUrl = createWrapper({
      ...defaultProps,
      description: 'https://example.com',
      isEditable: false,
    });

    expect(wrapperUrl.find('.description h4').exists()).toBe(false);
    expect(wrapperUrl.find('.description a').exists()).toBe(true);

    wrapperUrl.unmount();
  });

  it('should render the full long description without truncating the text content', () => {
    const longDescription =
      'This is a very long custom field value that should remain fully visible after wrapping across multiple lines in the contact info sidebar.';
    const wrapperLong = createWrapper({
      ...defaultProps,
      description: longDescription,
    });

    expect(wrapperLong.find('.description h4').text()).toBe(longDescription);

    wrapperLong.unmount();
  });
});
