import { mount } from '@vue/test-utils';
import TriggeredFlowsLoading from '../TriggeredFlowsLoading.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(TriggeredFlowsLoading);
};

describe('TriggeredFlowsLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
