import { mount } from '@vue/test-utils';
import ChatMessagesLoading from '../ChatMessages.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(ChatMessagesLoading);
};

describe('ChatMessagesLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
