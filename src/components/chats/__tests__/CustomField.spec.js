import { mount, createLocalVue } from '@vue/test-utils';
import i18n from '@/plugins/i18n';

import CustomField from '../ContactInfo/CustomField';
import defaultProps from './mocks/customFieldMock.js';

const localVue = createLocalVue();

function createWrapper() {
  const wrapper = mount(CustomField, {
    propsData: defaultProps,
    stubs: {
      UnnnicToolTip: true,
    },
    localVue,
    i18n,
  });

  return wrapper;
}

describe('CustomField', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should renders the title and description', () => {
    expect(wrapper.find('.title').text()).toBe(`${defaultProps.title}:`);
    expect(wrapper.find('.description h4').text()).toBe(
      defaultProps.description,
    );
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
