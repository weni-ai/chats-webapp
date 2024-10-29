import { mount } from '@vue/test-utils';
import ClosedChatsHeaderLoading from '../ClosedChatsHeader.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(ClosedChatsHeaderLoading);
};

describe('ClosedChatsHeaderLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
