import { mount } from '@vue/test-utils';

import UserAvatar from '../UserAvatar.vue';

describe('UserAvatar', () => {
  it('should renders the first username character', () => {
    const username = 'Fake Contact';
    const wrapper = mount(UserAvatar, {
      propsData: {
        username,
      },
    });

    expect(wrapper.text()).toContain(username.charAt(0));
  });

  it('should apply the props-based classes', () => {
    const wrapper = mount(UserAvatar, {
      propsData: {
        username: 'Fake Contact',
        active: true,
        clickable: true,
        disabled: true,
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
      propsData: {
        username: 'Fake Contact',
        size,
      },
    });

    const classes = wrapper.classes().filter((c) => c.match(`\\b${size}\\b`));
    expect(classes.length).toBeGreaterThan(0);
  });
});
