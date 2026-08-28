import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FileMessage from '../media/FileMessage.vue';

describe('AssistantFileMessage', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders the filename and opens the file on click', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    wrapper = mount(FileMessage, {
      props: {
        src: 'https://example.com/doc.pdf',
        filename: 'doc.pdf',
      },
      global: {
        stubs: {
          UnnnicIcon: true,
        },
      },
    });

    expect(wrapper.text()).toContain('doc.pdf');
    await wrapper.find('[data-testid="assistant-file-open"]').trigger('click');
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/doc.pdf',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });
});
