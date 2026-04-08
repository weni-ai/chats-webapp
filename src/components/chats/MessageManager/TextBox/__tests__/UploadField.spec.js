import { config, mount } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import i18n from '@/plugins/i18n';
import MessageManagerTextBoxUploadField from '../UploadField.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

describe('MessageManagerTextBoxUploadField.vue', () => {
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({ stubActions: false });
    setActivePinia(pinia);
  });

  const createWrapper = () =>
    mount(MessageManagerTextBoxUploadField, {
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
      },
    });

  it('renders a hidden file input', () => {
    const wrapper = createWrapper();
    const input = wrapper.find('[data-testid="upload-field-input"]');
    expect(input.exists()).toBe(true);
    expect(input.attributes('multiple')).toBeDefined();
    expect(input.classes()).toContain('text-box__upload-field');
  });

  it('calls addMediaUploadFiles when files are selected', async () => {
    const messageManagerStore = useMessageManager();
    const spy = vi.spyOn(messageManagerStore, 'addMediaUploadFiles');

    const wrapper = createWrapper();

    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const field = wrapper.find('[data-testid="upload-field-input"]');
    const input = field.element;
    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });

    await field.trigger('change');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toHaveLength(1);
    expect(spy.mock.calls[0][0][0].name).toBe('doc.pdf');
  });

  it('exposes clickInput to open the native file picker', () => {
    const wrapper = createWrapper();
    const input = wrapper.find('[data-testid="upload-field-input"]').element;
    const clickSpy = vi.spyOn(input, 'click');

    wrapper.vm.clickInput();

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
