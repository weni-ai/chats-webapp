import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import moment from 'moment';

import Media from '../Media.vue';

import MediaService from '@/services/api/resources/chats/media';

vi.mock('@/services/api/resources/chats/media', () => ({
  default: { listFromContactAndRoom: vi.fn(() => ({ results: [] })) },
}));

describe('ContactMedia', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mount(Media, {
      props: {
        room: { contact: {}, uuid: 'room-uuid' },
        contactInfo: { uuid: 'contact-uuid' },
        history: false,
      },
    });
  });

  it('should render tabs correctly', () => {
    expect(wrapper.find('[data-testid="media-tab-medias"]').text()).toBe(
      wrapper.vm.$t('medias'),
    );
    expect(wrapper.find('[data-testid="media-tab-docs"]').text()).toBe(
      wrapper.vm.$t('docs'),
    );
    expect(wrapper.find('[data-testid="media-tab-audios"]').text()).toBe(
      wrapper.vm.$t('audios'),
    );
  });

  it('should return true if the tab is active', async () => {
    expect(wrapper.vm.isActiveTab('media')).toBe(true);
    expect(wrapper.vm.isActiveTab('docs')).toBe(false);
  });

  it('should format audio tooltip text correctly', () => {
    const audio = {
      sender: 'Agent',
      created_on: '2024-01-25T12:30:00Z',
    };

    const result = wrapper.vm.audioTooltipText(audio);

    expect(result).toBe(
      `Agent ${moment(audio.created_on).format('L')} at ${moment(audio.created_on).format('LT')}`,
    );
  });

  it('should extract the media name from the URL', () => {
    const mediaName = wrapper.vm.treatedMediaName(
      'https://example.com/path/to/media.mp4',
    );
    expect(mediaName).toBe('media.mp4');
  });

  it('should throw an error if no URL is provided', () => {
    expect(() => wrapper.vm.treatedMediaName(null)).toThrow(
      'Pass as a parameter the name of the media you want to handle',
    );
  });

  it('should load and process media correctly', async () => {
    await MediaService.listFromContactAndRoom.mockResolvedValue({
      results: [
        {
          url: 'https://example.com/audio.mp3',
          content_type: 'audio/mp3',
        },
        {
          url: 'https://example.com/image.png',
          content_type: 'image/png',
        },
      ],
      next: null,
    });

    wrapper.vm.loadNextMedias().then(() => {
      console.log(wrapper.vm.audios);
      expect(wrapper.vm.audios).toHaveLength(1);
      expect(wrapper.vm.medias).toHaveLength(1);
    });
  });

  it('should handle errors during download gracefully', () => {
    wrapper.vm.treatedMediaName = vi.fn(() => {
      throw new Error('Error during media processing');
    });

    const consoleSpy = vi.spyOn(console, 'error');
    wrapper.vm.download('https://example.com/media.mp4');
    expect(consoleSpy).toHaveBeenCalledWith(
      'An error occurred when trying to download the media:',
      expect.any(Error),
    );
  });
});
