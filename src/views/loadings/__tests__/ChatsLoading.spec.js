import { mount } from '@vue/test-utils';
import ChatsLoading from '../chats.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(ChatsLoading);
};

describe('ChatsLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
