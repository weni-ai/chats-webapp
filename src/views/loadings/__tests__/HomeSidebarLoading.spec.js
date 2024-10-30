import { mount } from '@vue/test-utils';
import HomeSidebarLoading from '../HomeSidebar.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(HomeSidebarLoading);
};

describe('HomeSidebarLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
