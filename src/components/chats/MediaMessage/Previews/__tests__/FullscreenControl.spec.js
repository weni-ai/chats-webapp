import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import FullscreenControl from '../FullscreenControl.vue';

describe('FullscreenControl', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(FullscreenControl, {
      props: {
        icon: 'fullscreen-enter-1',
      },
    });
  });

  it('renders the icon with the correct props', () => {
    const icon = wrapper.findComponent('[data-testid="control-icon"]');
    expect(icon.exists()).toBe(true);
    expect(icon.props('icon')).toBe('fullscreen-enter-1');
    expect(icon.props('scheme')).toBe('neutral-snow');
  });

  it('emits "click" event when clicked', async () => {
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('emits "click" event when Enter key is pressed', async () => {
    await wrapper.trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
