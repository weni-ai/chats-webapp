import { mount } from '@vue/test-utils';
import i18n from '@/plugins/i18n';
import UnnnicSystem from '@/plugins/UnnnicSystem';
import CustomField from '../ContactInfo/CustomField.vue';
import defaultProps from './mocks/customFieldMock.js';

function createWrapper(propsData) {
  const wrapper = mount(CustomField, {
    propsData,
    global: {
      plugins: [i18n, UnnnicSystem]
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
    const newProps = { ...defaultProps };
    newProps.description = 'https://example.com';
    newProps.isEditable = false;

    const wrapperWithURL = createWrapper(newProps);

    const anchorElement = wrapperWithURL.find('.description a');
    expect(anchorElement.exists()).toBe(true);
    expect(anchorElement.attributes().href).toBe(newProps.description);
    expect(anchorElement.attributes().target).toBe('_blank');

    wrapper.unmount();
  });

  it('should shows the input field when isCurrent prop is true', async () => {
    await wrapper.setProps({ isCurrent: true });
    expect(wrapper.find('input[type="text"]').isVisible()).toBe(true);
  });

  it('should hides the input field when isCurrent prop is false', async () => {
    await wrapper.setProps({ isCurrent: false });
    expect(wrapper.find('input[type="text"]').isVisible()).toBe(false);
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

  it('should emits "update-current-custom-field" event on input value change', async () => {
    const input = wrapper.find('input[type="text"]');
    await input.setValue('New Description');
    expect(wrapper.emitted('update-current-custom-field')).toBeTruthy();
    expect(wrapper.emitted('update-current-custom-field')[0][0]).toEqual({
      key: defaultProps.title,
      value: 'New Description',
    });
  });

  it('should emits "save-value" event on input blur', async () => {
    const input = wrapper.find('input[type="text"]');
    await input.trigger('blur');
    expect(wrapper.emitted('save-value')).toBeTruthy();
  });

  it('should emits "save-value" event on input enter keypress', async () => {
    const input = wrapper.find('input[type="text"]');
    await input.trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('save-value')).toBeTruthy();
  });
});
