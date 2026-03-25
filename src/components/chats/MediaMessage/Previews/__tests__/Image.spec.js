import { mount, config } from '@vue/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import Image from '../Image.vue';

describe('ImagePreview', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Image, {
      props: {
        url: 'https://example.com/image.png',
        alt: 'Example image',
        tooltip: 'View image',
        objectFit: 'contain',
        fullscreen: false,
        fullscreenOnClick: true,
      },
      global: {
        components: {
          UnnnicToolTip: config.global.stubs.UnnnicToolTip,
        },
      },
    });
  });

  it('renders the image with the correct attributes', () => {
    const img = wrapper.find('[data-testid="image-preview"]');
    expect(img.attributes('src')).toBe('https://example.com/image.png');
    expect(img.attributes('alt')).toBe('Example image');
    expect(img.attributes('style')).toContain('object-fit: contain');
  });

  it('renders the tooltip with the correct text', async () => {
    const tooltip = wrapper.findComponent({ name: 'UnnnicToolTipStub' });
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.props('text')).toBe('View image');

    await wrapper.setProps({ tooltip: '' });
    const updatedTooltip = wrapper.findComponent({ name: 'UnnnicToolTipStub' });
    expect(updatedTooltip.props('text')).toBe(wrapper.vm.$t('fullscreen_view'));
  });

  it('emits "click" event when the image is clicked', async () => {
    const img = wrapper.find('[data-testid="image-preview"]');
    await img.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('sets `isFullscreenByUserClick` to true when `fullscreenOnClick` is enabled and the image is clicked', async () => {
    const img = wrapper.find('[data-testid="image-preview"]');
    expect(wrapper.vm.isFullscreenByUserClick).toBe(false);
    await img.trigger('click');
    expect(wrapper.vm.isFullscreenByUserClick).toBe(true);
  });

  it('computes `isFullscreen` correctly when `fullscreen` prop is true', async () => {
    await wrapper.setProps({ fullscreen: true });
    expect(wrapper.vm.isFullscreen).toBe(true);
  });

  it('computes `isFullscreen` correctly when `fullscreenOnClick` is true and image is clicked', async () => {
    const img = wrapper.find('[data-testid="image-preview"]');
    await img.trigger('click');
    expect(wrapper.vm.isFullscreen).toBe(true);
  });

  it('does not set `isFullscreenByUserClick` when `fullscreenOnClick` is false', async () => {
    await wrapper.setProps({ fullscreenOnClick: false });
    const img = wrapper.find('[data-testid="image-preview"]');
    await img.trigger('click');
    expect(wrapper.vm.isFullscreenByUserClick).toBe(false);
  });

  it('handles Enter key press to emit "click"', async () => {
    const img = wrapper.find('[data-testid="image-preview"]');
    await img.trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
