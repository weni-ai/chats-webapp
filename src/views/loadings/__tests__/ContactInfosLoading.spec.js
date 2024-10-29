import { mount } from '@vue/test-utils';
import ContactInfosLoading from '../ContactInfos.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(ContactInfosLoading);
};

describe('ContactInfosLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
