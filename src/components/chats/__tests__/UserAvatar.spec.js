import { mount } from '@vue/test-utils';
import UnnnicSystem from '@/plugins/UnnnicSystem';

import UserAvatar from '../UserAvatar.vue';

describe('UserAvatar', () => {
  it('should renders the first username character', () => {
    const username = 'Fake Contact';
    const wrapper = mount(UserAvatar, {
      props: {
        username,
      },
      global: {
        plugins: [UnnnicSystem],
      },
    });

    expect(wrapper.text()).toContain(username.charAt(0));
  });

  it('should apply the props-based classes', () => {
    const wrapper = mount(UserAvatar, {
      props: {
        username: 'Fake Contact',
        active: true,
        clickable: true,
        disabled: true,
      },
      global: {
        plugins: [UnnnicSystem],
      },
    });

    const classes = wrapper.classes();
    expect(classes).toContain('active');
    expect(classes).toContain('clickable');
    expect(classes).toContain('disabled');
  });

  it('should apply the component size based on the `size` prop', () => {
    const size = '2xl';
    const wrapper = mount(UserAvatar, {
      props: {
        username: 'Fake Contact',
        size,
      },
      global: {
        plugins: [UnnnicSystem],
      },
    });

    const classes = wrapper.classes().filter((c) => c.match(`\\b${size}\\b`));
    expect(classes.length).toBeGreaterThan(0);
  });
});
