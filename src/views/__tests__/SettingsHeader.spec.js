import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

import SettingsHeader from '@/views/Settings/SettingsHeader.vue';

const createWrapper = (props) => {
  return mount(SettingsHeader, {
    props,
    global: {
      stubs: {
        UnnnicAvatarIcon: true,
      },
    },
  });
};

describe('SettingsHeader.vue', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should render the UnnnicAvatarIcon with correct props', () => {
    const avatarIcon = wrapper.findComponent(
      '[data-testid=settings-view-header-icon]',
    );

    expect(avatarIcon.exists()).toBe(true);
    expect(avatarIcon.props('icon')).toBe('settings');
    expect(avatarIcon.props('scheme')).toBe('weni-600');
  });

  it('should render the header title with correct text', () => {
    const headerTitle = wrapper.find(
      '[data-testid=settings-view-header-title]',
    );

    expect(headerTitle.exists()).toBe(true);
    expect(headerTitle.text()).toBe(wrapper.vm.$t('config_chats.title'));
  });

  it('Should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
