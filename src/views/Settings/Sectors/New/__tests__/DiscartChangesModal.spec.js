import { beforeEach, describe } from 'vitest';
import { mount, config } from '@vue/test-utils';

import DiscartChangesModal from '@/views/Settings/DiscartChangesModal.vue';

const createWrapper = () => {
  return mount(DiscartChangesModal, {
    props: { showModal: true, title: 'Title', text: 'Text' },
    global: {
      components: {
        UnnnicModalDialog: config.global.stubs.UnnnicModalDialog,
      },
      stubs: {
        teleport: true,
      },
    },
  });
};

describe('DiscartChangesModal.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should pass correct props to modal', async () => {
    const modal = wrapper.findComponent({ name: 'UnnnicModalDialogStub' });
    expect(modal.exists()).toBe(true);
    expect(modal.props('title')).toBe('Title');
    expect(modal.props('modelValue')).toBe(true);
    expect(modal.props('size')).toBe('sm');
    expect(modal.props('primaryButtonProps')).toEqual(
      expect.objectContaining({ text: expect.any(String) }),
    );
    expect(modal.props('secondaryButtonProps')).toEqual(
      expect.objectContaining({ text: expect.any(String) }),
    );
  });

  it('should have correct text prop', () => {
    expect(wrapper.props('text')).toBe('Text');
  });
  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
