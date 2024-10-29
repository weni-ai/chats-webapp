import { mount } from '@vue/test-utils';
import ChatClassifierLoading from '../ChatClassifier.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(ChatClassifierLoading);
};

describe('ChatClassifierLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
