import { beforeEach, describe, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import MediaMessage from '../index.vue';
import Media from '@/services/api/resources/chats/media';
import mime from 'mime-types';

vi.mock('@/services/api/resources/chats/media');

describe('MediaMessage', () => {
  let wrapper;
  const mediaBase = {
    url: 'https://example.com/media/file.jpg',
    content_type: 'image/jpeg',
  };

  beforeEach(() => {
    wrapper = mount(MediaMessage, {
      props: { media: mediaBase },
      global: {
        stubs: {
          VideoPreview: true,
        },
      },
    });
    vi.resetAllMocks();
  });

  it('renders geolocation text when isGeolocation is true', async () => {
    const media = { ...mediaBase, content_type: 'application/geo+json' };
    await wrapper.setProps({ media });

    expect(wrapper.text()).toContain(media.url);
    expect(wrapper.find('[data-testid="media-message"]').exists()).toBe(false);
  });

  it('renders DocumentPreview when isDocument is true', async () => {
    const media = { ...mediaBase, content_type: 'application/pdf' };
    await wrapper.setProps({ media });

    expect(
      wrapper.findComponent('[data-testid="document-preview"]').exists(),
    ).toBe(true);
  });

  it('renders ImagePreview when isImage is true', () => {
    expect(
      wrapper.findComponent('[data-testid="image-preview"]').exists(),
    ).toBe(true);
  });

  it('renders VideoPreview when isVideo is true', async () => {
    const media = { ...mediaBase, content_type: 'video/mp4' };
    await wrapper.setProps({ media });

    expect(
      wrapper.findComponent('[data-testid="video-preview"]').exists(),
    ).toBe(true);
  });

  it('renders UnnnicAudioRecorder when isAudio is true', async () => {
    const media = { ...mediaBase, content_type: 'audio/mpeg3' };

    await wrapper.setProps({ media });

    expect(
      wrapper.findComponent('[data-testid="audio-preview"]').exists(),
    ).toBe(true);
  });

  it('calls the download method and triggers file download', async () => {
    const mockFile = new Blob(['mock content'], { type: 'application/pdf' });

    Media.get.mockResolvedValue(mockFile);

    const media = { ...mediaBase, content_type: 'application/pdf' };

    await wrapper.setProps({ media });

    const downloadMethod = vi.spyOn(wrapper.vm, 'download');

    await wrapper.vm.download();

    expect(downloadMethod).toHaveBeenCalled();
    expect(Media.get).toHaveBeenCalledWith(media.url);
  });

  it('handles download errors gracefully', async () => {
    Media.get.mockRejectedValueOnce(new Error('Download error'));

    console.error = vi.fn();
    await wrapper.vm.download();

    expect(console.error).toHaveBeenCalledWith(
      'Não foi possível realizar o download no momento',
    );
  });

  it('emits fullscreen event on ImagePreview click', async () => {
    const imagePreview = wrapper.findComponent('[data-testid="image-preview"]');

    await imagePreview.vm.$emit('click');

    expect(wrapper.emitted('fullscreen')).toBeTruthy();
  });

  it('computes fullFilename correctly', () => {
    expect(wrapper.vm.fullFilename).toBe('file.jpg');
  });

  it('matches mime type correctly for isDocument', async () => {
    const media = { ...mediaBase, content_type: 'application/pdf' };
    mime.extension = vi.fn(() => 'pdf');

    await wrapper.setProps({ media });

    expect(wrapper.vm.isDocument).toBe(true);
  });
});
