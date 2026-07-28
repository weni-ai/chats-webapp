import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import ModalProgressBar from '../ModalProgressBar.vue';

describe('ModalProgressBar', () => {
  let wrapper;

  const createWrapper = (props = {}) =>
    mount(ModalProgressBar, {
      props: {
        modelValue: 40,
        title: 'Sending messages',
        subtitle: 'Please wait',
        type: 'primary',
        ...props,
      },
    });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should render progress bar with provided props', () => {
    wrapper = createWrapper({ modelValue: 75 });

    expect(wrapper.find('[data-testid="modal-progress-bar"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain('Please wait');
    expect(wrapper.text()).toContain('75');
  });

  it('should prevent dismiss on outside pointer and escape', () => {
    wrapper = createWrapper();
    const event = { preventDefault: vi.fn() };

    wrapper.vm.preventDismiss(event);
    wrapper.vm.preventDismiss(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(2);
  });
});
