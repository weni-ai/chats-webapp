import { mount } from '@vue/test-utils';
import RoomsTableFiltersLoading from '../RoomsTableFiltersLoading.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(RoomsTableFiltersLoading);
};

describe('RoomsTableFiltersLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
