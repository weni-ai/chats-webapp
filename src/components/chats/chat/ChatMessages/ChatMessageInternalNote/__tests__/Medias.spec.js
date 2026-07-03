import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import Medias from '../Medias.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

const imageMedia = {
  content_type: 'image/jpeg',
  url: 'https://example.com/image-1.jpg',
  message: 'image-1.jpg',
};

const secondImageMedia = {
  content_type: 'image/png',
  url: 'https://example.com/image-2.png',
  message: 'image-2.png',
};

const loadingMedia = {
  content_type: 'image/jpeg',
  tempId: 'temp-1',
  isLoading: true,
  file: { name: 'uploading.jpg' },
};

const videoMedia = {
  content_type: 'video/mp4',
  url: 'https://example.com/video.mp4',
};

const documentMedia = {
  content_type: 'application/pdf',
  url: 'https://example.com/document.pdf',
  message: 'document.pdf',
};

const audioMedia = {
  content_type: 'audio/mpeg',
  url: 'https://example.com/audio.mp3',
};

const createWrapper = (medias = [imageMedia]) => {
  return mount(Medias, {
    props: { medias },
    global: {
      stubs: {
        UnnnicIconLoading: {
          template: '<div data-testid="loading-icon" />',
        },
        VideoPlayer: {
          props: ['src'],
          template: '<div data-testid="video-player">{{ src }}</div>',
        },
        MediaDocumentCard: {
          props: ['media'],
          template:
            '<div data-testid="media-document-card">{{ media.message }}</div>',
        },
        FullscreenPreview: {
          props: [
            'downloadMediaUrl',
            'downloadMediaName',
            'mediaCurrent',
            'mediaTotal',
          ],
          template: `
            <div data-testid="fullscreen-preview">
              <span data-testid="fullscreen-current">{{ mediaCurrent }}</span>
              <span data-testid="fullscreen-total">{{ mediaTotal }}</span>
              <button data-testid="fullscreen-close" @click="$emit('close')">
                close
              </button>
              <button data-testid="fullscreen-next" @click="$emit('next')">
                next
              </button>
              <button
                data-testid="fullscreen-previous"
                @click="$emit('previous')"
              >
                previous
              </button>
            </div>
          `,
        },
      },
    },
  });
};

describe('Medias.vue', () => {
  useCompositionI18nInThisSpecFile();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render loading state for pending media', () => {
      const wrapper = createWrapper([loadingMedia]);

      expect(wrapper.find('[data-testid="loading-icon"]').exists()).toBe(true);
      expect(
        wrapper.find('.chat-messages__internal-note-medias__preview').exists(),
      ).toBe(false);
    });

    it('should render image preview button for image media', () => {
      const wrapper = createWrapper([imageMedia]);

      expect(
        wrapper
          .find('.chat-messages__internal-note-medias__preview-button')
          .exists(),
      ).toBe(true);
      expect(wrapper.find('img').attributes('src')).toBe(imageMedia.url);
    });

    it('should render video player for video media', () => {
      const wrapper = createWrapper([videoMedia]);

      expect(wrapper.find('[data-testid="video-player"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="video-player"]').text()).toBe(
        videoMedia.url,
      );
    });

    it('should render document card for document media', () => {
      const wrapper = createWrapper([documentMedia]);

      expect(wrapper.find('[data-testid="media-document-card"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="media-document-card"]').text()).toBe(
        documentMedia.message,
      );
    });

    it('should not render unsupported media types', () => {
      const wrapper = createWrapper([audioMedia]);

      expect(wrapper.find('[data-testid="loading-icon"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="video-player"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="media-document-card"]').exists()).toBe(
        false,
      );
      expect(
        wrapper.find('.chat-messages__internal-note-medias__slot').exists(),
      ).toBe(false);
    });
  });

  describe('image interactions', () => {
    it('should mark image as visible after load event', async () => {
      const wrapper = createWrapper([imageMedia]);
      const image = wrapper.find('img');

      expect(image.classes()).not.toContain(
        'chat-messages__internal-note-medias__preview--visible',
      );

      await image.trigger('load');

      expect(image.classes()).toContain(
        'chat-messages__internal-note-medias__preview--visible',
      );
      expect(wrapper.find('[data-testid="loading-icon"]').exists()).toBe(false);
    });

    it('should open and close fullscreen preview for images', async () => {
      const wrapper = createWrapper([imageMedia, secondImageMedia]);
      const image = wrapper.find('img');

      await image.trigger('load');
      await wrapper
        .find('.chat-messages__internal-note-medias__preview-button')
        .trigger('click');

      expect(wrapper.find('[data-testid="fullscreen-preview"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="fullscreen-current"]').text()).toBe(
        '1',
      );
      expect(wrapper.find('[data-testid="fullscreen-total"]').text()).toBe('2');

      await wrapper.find('[data-testid="fullscreen-close"]').trigger('click');

      expect(wrapper.find('[data-testid="fullscreen-preview"]').exists()).toBe(
        false,
      );
    });

    it('should navigate between fullscreen images', async () => {
      const wrapper = createWrapper([imageMedia, secondImageMedia]);

      await wrapper.findAll('img')[0].trigger('load');
      await wrapper.findAll('img')[1].trigger('load');
      await wrapper
        .findAll('.chat-messages__internal-note-medias__preview-button')[0]
        .trigger('click');

      await wrapper.find('[data-testid="fullscreen-next"]').trigger('click');
      expect(wrapper.find('[data-testid="fullscreen-current"]').text()).toBe(
        '2',
      );

      await wrapper
        .find('[data-testid="fullscreen-previous"]')
        .trigger('click');
      expect(wrapper.find('[data-testid="fullscreen-current"]').text()).toBe(
        '1',
      );
    });
  });
});
