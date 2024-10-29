import { mount } from '@vue/test-utils';
import MessageManagerLoading from '../MessageManager.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(MessageManagerLoading);
};

describe('MessageManagerLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
