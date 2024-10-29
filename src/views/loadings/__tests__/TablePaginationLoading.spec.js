import { mount } from '@vue/test-utils';
import TablePaginationLoading from '../TablePaginationLoading.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(TablePaginationLoading);
};

describe('TablePaginationLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
