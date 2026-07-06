import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import MediaDocumentCard from '../MediaDocumentCard.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';
import Media from '@/services/api/resources/chats/media';

vi.mock('@/services/api/resources/chats/media', () => ({
  default: {
    download: vi.fn(),
  },
}));

const createWrapper = (media = {}) => {
  return mount(MediaDocumentCard, {
    props: {
      media: {
        content_type: 'application/pdf',
        url: 'https://example.com/files/report.pdf?download=true',
        ...media,
      },
    },
    global: {
      stubs: {
        UnnnicIcon: {
          props: ['icon', 'scheme'],
          template: '<span data-testid="document-icon" />',
        },
      },
    },
  });
};

describe('MediaDocumentCard.vue', () => {
  useCompositionI18nInThisSpecFile();

  beforeEach(() => {
    vi.clearAllMocks();
    Media.download.mockResolvedValue();
  });

  describe('rendering', () => {
    it('should render treated filename from media url', () => {
      const wrapper = createWrapper();

      expect(
        wrapper
          .find('.chat-messages__internal-note-media-document-card__filename')
          .text(),
      ).toBe('report.pdf');
      expect(
        wrapper
          .find('.chat-messages__internal-note-media-document-card__filename')
          .attributes('title'),
      ).toBe('report.pdf');
    });

    it('should render filename from file name when url is missing', () => {
      const wrapper = createWrapper({
        url: undefined,
        file: { name: 'local-file.docx' },
      });

      expect(
        wrapper
          .find('.chat-messages__internal-note-media-document-card__filename')
          .text(),
      ).toBe('local-file.docx');
    });
  });

  describe('downloadMedia', () => {
    it('should download media when card is clicked', async () => {
      const wrapper = createWrapper();

      await wrapper
        .find('.chat-messages__internal-note-media-document-card')
        .trigger('click');
      await flushPromises();

      expect(Media.download).toHaveBeenCalledWith({
        media: 'https://example.com/files/report.pdf?download=true',
        name: 'report.pdf?download=true',
      });
    });

    it('should use preview url when media url is missing', async () => {
      const wrapper = createWrapper({
        url: undefined,
        preview: 'https://example.com/preview/report.pdf',
        file: { name: 'report.pdf' },
      });

      await wrapper
        .find('.chat-messages__internal-note-media-document-card')
        .trigger('click');
      await flushPromises();

      expect(Media.download).toHaveBeenCalledWith({
        media: 'https://example.com/preview/report.pdf',
        name: 'report.pdf',
      });
    });

    it('should log error when download fails', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      Media.download.mockRejectedValueOnce(new Error('Download failed'));

      const wrapper = createWrapper();

      await wrapper
        .find('.chat-messages__internal-note-media-document-card')
        .trigger('click');
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(
        'An error occurred when trying to download the media:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});
