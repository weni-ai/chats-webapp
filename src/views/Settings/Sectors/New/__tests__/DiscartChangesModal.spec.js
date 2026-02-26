import { beforeEach, describe } from 'vitest';
import { mount } from '@vue/test-utils';

import DiscartChangesModal from '@/views/Settings/DiscartChangesModal.vue';

const createWrapper = () => {
  return mount(DiscartChangesModal, {
    props: { showModal: true, title: 'Title', text: 'Text' },
    global: {
      components: {},
    },
  });
};

describe('DiscartChangesModal.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should have correct text prop', () => {
    expect(wrapper.props('text')).toBe('Text');
  });
  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
