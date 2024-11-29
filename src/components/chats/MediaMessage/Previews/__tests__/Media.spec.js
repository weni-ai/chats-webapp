import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import Media from '../Media.vue';

describe('MediaPreview', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Media, {
      props: {
        src: 'https://example.com/media.mp4',
        alt: 'Example media',
        isVideo: false,
      },
    });
  });

  it('renders an image when isVideo is false', () => {
    const img = wrapper.find('[data-testid="media-image"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/media.mp4');
    expect(img.attributes('alt')).toBe('Example media');

    const video = wrapper.find('[data-testid="media-video"]');
    expect(video.exists()).toBe(false);
  });

  it('renders a video and play icon when isVideo is true', async () => {
    await wrapper.setProps({ isVideo: true });

    const video = wrapper.find('[data-testid="media-video"]');
    expect(video.exists()).toBe(true);
    expect(video.attributes('src')).toBe('https://example.com/media.mp4');
    expect(video.attributes('alt')).toBe('Example media');
    const playIcon = wrapper.findComponent('[data-testid="play-button"]');
    expect(playIcon.exists()).toBe(true);
  });

  it('emits "click" event when the image is clicked', async () => {
    const img = wrapper.find('[data-testid="media-image"]');
    await img.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('emits "click" event when the video is clicked', async () => {
    await wrapper.setProps({ isVideo: true });
    const video = wrapper.find('[data-testid="media-video"]');
    await video.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('emits "click" event when the Enter key is pressed on an image', async () => {
    const img = wrapper.find('[data-testid="media-image"]');
    await img.trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('emits "click" event when the Enter key is pressed on a video', async () => {
    await wrapper.setProps({ isVideo: true });
    const video = wrapper.find('[data-testid="media-video"]');
    await video.trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
