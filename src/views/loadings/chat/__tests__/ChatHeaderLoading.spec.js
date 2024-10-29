import { mount } from '@vue/test-utils';
import ChatHeaderLoading from '../ChatHeader.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(ChatHeaderLoading);
};

describe('ChatHeaderLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
