import { mount } from '@vue/test-utils';
import RoomsListLoading from '../RoomsList.vue';
import { beforeEach, describe, expect } from 'vitest';

const createWrapper = () => {
  return mount(RoomsListLoading);
};

describe('RoomsListLoading.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
