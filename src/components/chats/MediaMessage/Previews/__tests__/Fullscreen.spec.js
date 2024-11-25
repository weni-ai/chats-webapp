import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, vi } from 'vitest';

import Fullscreen from '../Fullscreen.vue';
import FullscreenControl from '../FullscreenControl.vue';

describe('FullscreenPreview', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Fullscreen, {
      props: {
        downloadMediaUrl: 'https://example.com/media.jpg',
        downloadMediaName: 'media.jpg',
      },
      global: {
        components: { FullscreenControl },
      },
    });
  });

  it('emits "close" event when clicking outside', async () => {
    await wrapper.trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('does not emit "close" when clicking inside toolbar or media', async () => {
    await wrapper.find('[data-testid="toolbar"]').trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();

    await wrapper.find('[data-testid="media-container"]').trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('emits "next" and "previous" events when navigation buttons are clicked', async () => {
    const nextButton = wrapper.findComponent('[data-testid="next-button"]');
    const prevButton = wrapper.findComponent('[data-testid="previous-button"]');

    await nextButton.trigger('click');
    expect(wrapper.emitted('next')).toHaveLength(1);

    await prevButton.trigger('click');
    expect(wrapper.emitted('previous')).toHaveLength(1);
  });

  it('toggles zoom state when zoom button is clicked', async () => {
    const zoomButton = wrapper.findComponent('[data-testid="zoom-button"]');

    expect(wrapper.vm.isZoomed).toBe(false);

    await zoomButton.trigger('click');
    expect(wrapper.vm.isZoomed).toBe(true);

    await zoomButton.trigger('click');
    expect(wrapper.vm.isZoomed).toBe(false);
  });

  it('rotates media when rotate buttons are clicked', async () => {
    const rotateLeftButton = wrapper.findComponent(
      '[data-testid="rotate-left-button"]',
    );

    const rotateRightButton = wrapper.findComponent(
      '[data-testid="rotate-right-button"]',
    );

    await rotateLeftButton.trigger('click');
    expect(wrapper.vm.rotatedDeg).toBe(-90);

    await rotateRightButton.trigger('click');
    expect(wrapper.vm.rotatedDeg).toBe(0); // resets to initial state
  });

  it('downloads media when download button is clicked', async () => {
    const downloadButton = wrapper.findComponent(
      '[data-testid="download-button"]',
    );

    const downloadSpy = vi.spyOn(wrapper.vm, 'download');

    await downloadButton.trigger('click');

    expect(downloadSpy).toHaveBeenCalled();
  });

  it('resets zoom and rotation when navigating', async () => {
    wrapper.vm.isZoomed = true;
    wrapper.vm.rotatedDeg = 90;

    const nextButton = wrapper.findComponent('[data-testid="next-button"]');

    await nextButton.trigger('click');

    expect(wrapper.vm.isZoomed).toBe(false);
    expect(wrapper.vm.rotatedDeg).toBe(0);
  });
});
