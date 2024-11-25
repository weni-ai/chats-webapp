import { mount } from '@vue/test-utils';
import { beforeAll, beforeEach, describe, expect, vi } from 'vitest';

import Document from '../Document.vue';

describe('DocumentPreview', () => {
  let wrapper;

  const defaultWindowOpen = window.open;

  beforeEach(() => {
    window.open = defaultWindowOpen;
    wrapper = mount(Document, {
      props: {
        fullFilename: 'example.pdf',
        url: 'https://example.com/file.pdf',
        highlight: false,
        size: 'md',
      },
    });
  });

  beforeAll(() => {
    window.open = defaultWindowOpen;
  });

  it('renders the filename correctly', () => {
    const filenameElement = wrapper.find('[data-testid="filename"]');
    expect(filenameElement.text()).toBe('example.pdf');
  });

  it('renders the correct icon scheme', async () => {
    const icon = wrapper.findComponent('[data-testid="icon"]');
    expect(icon.exists()).toBe(true);
    expect(icon.props().scheme).toBe('neutral-darkest');
    await wrapper.setProps({ highlight: true });
    expect(icon.props().scheme).toBe('weni-600');
  });

  it('emits "download" event when clicked', async () => {
    window.open = vi.fn();
    const openFileSpy = vi.spyOn(wrapper.vm, 'openFile');
    await wrapper.trigger('click');
    expect(wrapper.emitted('download')).toHaveLength(1);
    expect(openFileSpy).toHaveBeenCalledWith(wrapper.vm.url);
    vi.clearAllMocks();
  });

  it('emits "download" event when clicked', async () => {
    window.open = vi.fn();
    await wrapper.trigger('keypress', { key: 'Enter' });
    expect(wrapper.emitted('download')).toHaveLength(1);
  });
});
