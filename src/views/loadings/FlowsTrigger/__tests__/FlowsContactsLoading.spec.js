import { mount } from '@vue/test-utils';
import FlowsContactsLoading from '../FlowsContactsLoading.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(FlowsContactsLoading);
};

describe('FlowsContactsLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
