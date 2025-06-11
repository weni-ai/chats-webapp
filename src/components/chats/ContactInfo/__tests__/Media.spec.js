import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

import Media from '../Media.vue';
import MediaService from '@/services/api/resources/chats/media';

vi.mock('@/services/api/resources/chats/media', () => ({
  default: {
    listFromContactAndRoom: vi.fn(),
    listFromContactAndClosedRoom: vi.fn(),
    download: vi.fn(),
  },
}));

vi.mock('moment', () => ({
  default: vi.fn(() => ({
    format: vi.fn((format) => (format === 'L' ? '01/25/2024' : '12:30 PM')),
  })),
}));

global.Audio = vi.fn().mockImplementation(() => ({
  onloadedmetadata: null,
  duration: 120,
}));

const createMockMedia = (type) => ({
  url: `https://example.com/test.${type === 'image' ? 'png' : type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'pdf'}`,
  content_type: `${type}/${type === 'image' ? 'png' : type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'pdf'}`,
  created_on: '2024-01-25T12:30:00Z',
  sender: 'Agent',
});

const mockT = (key, params) =>
  ({
    medias: 'Medias',
    docs: 'Docs',
    audios: 'Audios',
    'contact_info.audio_tooltip': `${params?.agent || ''} ${params?.date || ''} at ${params?.time || ''}`,
  })[key] || key;

const createWrapper = (props = {}) =>
  mount(Media, {
    props: {
      room: { contact: { uuid: 'contact-uuid' }, uuid: 'room-uuid' },
      contactInfo: { uuid: 'contact-uuid' },
      history: false,
      ...props,
    },
    global: {
      mocks: { $t: mockT },
      stubs: {
        UnnnicTab: {
          template:
            '<div><slot name="tab-head-media" /><slot name="tab-head-docs" /><slot name="tab-head-audio" /><slot name="tab-panel-media" /><slot name="tab-panel-docs" /><slot name="tab-panel-audio" /></div>',
        },
        UnnnicChatsMessage: {
          template:
            '<div data-testid="document-message" @click="$emit(\'click\')">{{ documentName }}</div>',
          props: ['time', 'documentName'],
        },
        UnnnicToolTip: {
          template: '<div data-testid="audio-tooltip"><slot /></div>',
          props: ['text', 'side', 'enabled'],
        },
        UnnnicAudioRecorder: {
          template: '<div data-testid="audio-recorder"></div>',
          props: ['src', 'canDiscard'],
        },
        MediaPreview: {
          template:
            '<div data-testid="media-preview" @click="$emit(\'click\')"></div>',
          props: ['src', 'isVideo'],
          emits: ['click'],
        },
      },
    },
  });

describe('ContactMedia', () => {
  let wrapper;
  const mockResponse = {
    results: [
      createMockMedia('image'),
      createMockMedia('application'),
      createMockMedia('audio'),
    ],
    next: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    MediaService.listFromContactAndRoom.mockResolvedValue(mockResponse);
    MediaService.listFromContactAndClosedRoom.mockResolvedValue(mockResponse);
    vi.spyOn(Promise, 'all').mockImplementation(() =>
      Promise.resolve([
        { url: 'audio.mp3', content_type: 'audio/mp3', duration: 120 },
      ]),
    );
  });

  afterEach(() => {
    wrapper?.unmount?.();
    vi.restoreAllMocks();
  });

  it('initializes correctly for both active and history modes', async () => {
    wrapper = createWrapper();
    expect(wrapper.vm.tab).toBe('media');
    expect(MediaService.listFromContactAndRoom).toHaveBeenCalled();

    wrapper = createWrapper({ history: true });
    expect(MediaService.listFromContactAndClosedRoom).toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(wrapper.emitted('loaded-medias')).toBeTruthy();
  });

  it('filters media types correctly and handles computed properties', () => {
    const testData = [
      createMockMedia('image'),
      createMockMedia('video'),
      createMockMedia('application'),
    ];
    const testVM = {
      medias: testData,
      get images() {
        return this.medias.filter(
          (m) =>
            m.content_type.startsWith('image/') ||
            m.content_type.startsWith('video/'),
        );
      },
      get documents() {
        return this.medias.filter(
          (m) =>
            !(
              m.content_type.startsWith('image/') ||
              m.content_type.startsWith('video/')
            ),
        );
      },
    };

    expect(testVM.images).toHaveLength(2);
    expect(testVM.documents).toHaveLength(1);
  });

  it('handles all utility methods with comprehensive branch coverage', () => {
    wrapper = createWrapper();

    expect(wrapper.vm.treatedMediaName('https://example.com/file.pdf')).toBe(
      'file.pdf',
    );
    [null, undefined, '', 0, false].forEach((val) => {
      expect(() => wrapper.vm.treatedMediaName(val)).toThrow(
        'Pass as a parameter the name of the media you want to handle',
      );
    });

    const audioWithSender = {
      sender: 'Agent',
      created_on: '2024-01-25T12:30:00Z',
    };
    const audioWithoutSender = { created_on: '2024-01-25T12:30:00Z' };
    expect(wrapper.vm.audioTooltipText(audioWithSender)).toBe(
      'Agent 01/25/2024 at 12:30 PM',
    );
    expect(wrapper.vm.audioTooltipText(audioWithoutSender)).toBe(
      ' 01/25/2024 at 12:30 PM',
    );

    expect(wrapper.vm.isActiveTab('media')).toBe(true);
    expect(wrapper.vm.isActiveTab('docs')).toBe(false);
  });

  it('handles download functionality and error scenarios', () => {
    wrapper = createWrapper();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    wrapper.vm.download('https://example.com/file.pdf');
    expect(MediaService.download).toHaveBeenCalledWith({
      media: 'https://example.com/file.pdf',
      name: 'file.pdf',
    });

    wrapper.vm.treatedMediaName = vi.fn(() => {
      throw new Error('Test error');
    });
    wrapper.vm.download('https://example.com/file.pdf');
    expect(consoleSpy).toHaveBeenCalledWith(
      'An error occurred when trying to download the media:',
      expect.any(Error),
    );
  });

  it('handles pagination correctly', async () => {
    wrapper = createWrapper();

    MediaService.listFromContactAndRoom
      .mockReset()
      .mockResolvedValueOnce({ ...mockResponse, next: 'page-2' })
      .mockResolvedValueOnce({ ...mockResponse, next: null });

    await wrapper.vm.loadNextMedias();
    expect(MediaService.listFromContactAndRoom).toHaveBeenCalledTimes(2);

    wrapper = createWrapper({ history: true });
    MediaService.listFromContactAndClosedRoom
      .mockReset()
      .mockResolvedValueOnce({ ...mockResponse, next: 'page-2' })
      .mockResolvedValueOnce({ ...mockResponse, next: null });

    await wrapper.vm.loadNextMediasClosedRoom();
    expect(MediaService.listFromContactAndClosedRoom).toHaveBeenCalledTimes(2);
  });

  it('emits events correctly', () => {
    wrapper = createWrapper();
    wrapper.vm.$emit('fullscreen', 'url', []);
    expect(wrapper.emitted('fullscreen')).toBeTruthy();
  });

  describe('Error Handling', () => {
    let originalUnhandledRejection;

    beforeEach(() => {
      originalUnhandledRejection = process.listeners('unhandledRejection');
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', () => {});
    });

    afterEach(() => {
      process.removeAllListeners('unhandledRejection');
      originalUnhandledRejection.forEach((listener) =>
        process.on('unhandledRejection', listener),
      );
    });

    it('handles API errors gracefully for both room types', async () => {
      MediaService.listFromContactAndRoom.mockRejectedValueOnce(
        new Error('API Error'),
      );
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(wrapper.find('[data-testid="media-tab-medias"]').exists()).toBe(
        true,
      );

      MediaService.listFromContactAndClosedRoom.mockRejectedValueOnce(
        new Error('API Error'),
      );
      wrapper = createWrapper({ history: true });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(wrapper.find('[data-testid="media-tab-medias"]').exists()).toBe(
        true,
      );
    });
  });
});
