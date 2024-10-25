import { mount } from '@vue/test-utils';
import RoomsTableLoading from '../RoomsTableLoading.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(RoomsTableLoading);
};

describe('RoomsTableLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
