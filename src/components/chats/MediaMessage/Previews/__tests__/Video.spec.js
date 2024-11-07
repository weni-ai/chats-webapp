import { mount } from '@vue/test-utils';
import Video from '../Video.vue';

import { beforeEach, describe, vi } from 'vitest';

vi.mock('plyr', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('MediaVideoPreview.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Video, {
      props: {
        src: 'https://example.com/video.mp4',
      },
    });
  });

  it('renders the video element with the correct source', () => {
    const video = wrapper.find('[data-testid="video-preview"]');
    expect(video.exists()).toBe(true);
    expect(video.find('source').attributes('src')).toBe(
      'https://example.com/video.mp4',
    );
  });

  it('sets isFullcreen to true on enterfullscreen event', () => {
    wrapper.vm.player.on.mock.calls[0][1](); // Simulates the event callback call
    expect(wrapper.vm.isFullcreen).toBe(true);
  });

  it('sets isFullcreen to false on exitfullscreen event', () => {
    wrapper.vm.player.on.mock.calls[1][1](); // Simulates the event callback call
    expect(wrapper.vm.isFullcreen).toBe(false);
  });
});
