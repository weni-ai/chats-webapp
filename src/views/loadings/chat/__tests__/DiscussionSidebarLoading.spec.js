import { mount } from '@vue/test-utils';
import DiscussionSidebarLoading from '../DiscussionSidebar.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(DiscussionSidebarLoading);
};

describe('DiscussionSidebarLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
