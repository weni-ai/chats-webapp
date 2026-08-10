import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import ChatsNavbar from '../ChatsNavbar.vue';

const createWrapper = (props = {}) => {
  const actionHome = vi.fn();
  const actionSettings = vi.fn();

  return {
    actionHome,
    actionSettings,
    wrapper: mount(ChatsNavbar, {
      props: {
        modelValue: 'home',
        links: [
          {
            name: 'home',
            icon: { default: 'home', selected: 'home-filled' },
            action: actionHome,
          },
          {
            name: 'settings',
            icon: 'settings',
            action: actionSettings,
          },
        ],
        ...props,
      },
      global: {
        stubs: {
          UnnnicIcon: {
            name: 'UnnnicIcon',
            template:
              '<span data-testid="nav-icon" :data-icon="icon" :data-filled="filled" />',
            props: ['icon', 'size', 'scheme', 'filled'],
          },
        },
      },
    }),
  };
};

describe('ChatsNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a link for each item', () => {
    const { wrapper } = createWrapper();
    expect(wrapper.findAll('.unnnic-chats-navbar__link')).toHaveLength(2);
  });

  it('should mark the selected link', () => {
    const { wrapper } = createWrapper({ modelValue: 'home' });
    const links = wrapper.findAll('.unnnic-chats-navbar__link');

    expect(links[0].classes()).toContain('selected');
    expect(links[1].classes()).not.toContain('selected');
  });

  it('should use selected icon object when link is active', () => {
    const { wrapper } = createWrapper({ modelValue: 'home' });
    const icons = wrapper.findAll('[data-testid="nav-icon"]');

    expect(icons[0].attributes('data-icon')).toBe('home-filled');
    expect(icons[0].attributes('data-filled')).toBe('true');
  });

  it('should use default icon object when link is inactive', () => {
    const { wrapper } = createWrapper({ modelValue: 'settings' });
    const icons = wrapper.findAll('[data-testid="nav-icon"]');

    expect(icons[0].attributes('data-icon')).toBe('home');
    expect(icons[0].attributes('data-filled')).toBe('false');
  });

  it('should use string icon when provided', () => {
    const { wrapper } = createWrapper({ modelValue: 'home' });
    const icons = wrapper.findAll('[data-testid="nav-icon"]');

    expect(icons[1].attributes('data-icon')).toBe('settings');
  });

  it('should emit update:modelValue and call action on click', async () => {
    const { wrapper, actionSettings } = createWrapper();
    const links = wrapper.findAll('.unnnic-chats-navbar__link');

    await links[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['settings']);
    expect(actionSettings).toHaveBeenCalled();
  });

  it('should reject empty links via prop validator', () => {
    const validator = ChatsNavbar.props.links.validator;
    expect(validator([])).toBe(false);
    expect(validator([{ name: 'home', icon: 'home', action: () => {} }])).toBe(
      true,
    );
    expect(
      validator([{ name: 'home', icon: { default: 'home' }, action: 'bad' }]),
    ).toBe(false);
  });
});
