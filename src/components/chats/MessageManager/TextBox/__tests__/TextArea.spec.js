import { config, flushPromises, mount } from '@vue/test-utils';
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
import MessageManagerTextBoxTextArea from '../TextArea.vue';
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

describe('MessageManagerTextBoxTextArea.vue', () => {
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({ stubActions: false });
    setActivePinia(pinia);
  });

  const createWrapper = () =>
    mount(MessageManagerTextBoxTextArea, {
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        stubs: {
          UnnnicIcon: {
            props: ['icon', 'clickable', 'scheme', 'size'],
            template:
              '<button type="button" class="icon-stub" :data-icon="icon" @click="$emit(\'click\')" />',
          },
        },
      },
    });

  const resetTextareaVisibility = () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [];
  };

  it('renders textarea container when audio recorder is idle and there are no media files', () => {
    resetTextareaVisibility();

    const wrapper = createWrapper();
    expect(
      wrapper.find('[data-testid="text-box-textarea-container"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="text-area"]').exists()).toBe(true);
  });

  it('hides textarea container when there are media files', () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [
      new File(['x'], 'f.png', { type: 'image/png' }),
    ];

    const wrapper = createWrapper();
    expect(
      wrapper.find('[data-testid="text-box-textarea-container"]').exists(),
    ).toBe(false);
  });

  it('hides textarea container when audio recorder is active', () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.audioRecorderStatus = 'recording';
    messageManagerStore.mediaUploadFiles = [];

    const wrapper = createWrapper();
    expect(
      wrapper.find('[data-testid="text-box-textarea-container"]').exists(),
    ).toBe(false);
  });

  it('updates store inputMessage on input', async () => {
    resetTextareaVisibility();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';

    const wrapper = createWrapper();
    await wrapper.find('[data-testid="text-area"]').setValue('hello');

    expect(messageManagerStore.inputMessage).toBe('hello');
  });

  it('emits keydown with the keyboard event', async () => {
    resetTextareaVisibility();

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="text-area"]')
      .trigger('keydown', { key: 'a' });

    expect(wrapper.emitted('keydown')).toBeTruthy();
    expect(wrapper.emitted('keydown')[0][0].key).toBe('a');
  });

  it('prevents default on Enter without Shift', async () => {
    resetTextareaVisibility();

    const wrapper = createWrapper();
    const element = wrapper.find('[data-testid="text-area"]').element;
    const ev = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: false,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(ev, 'preventDefault');

    element.dispatchEvent(ev);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('shows internal note close button, prefix and empty placeholder when isInternalNote', () => {
    resetTextareaVisibility();
    const messageManagerStore = useMessageManager();
    messageManagerStore.isInternalNote = true;

    const wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="internal-note-close-button"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="internal-note-prefix"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="text-area"]').attributes('placeholder'),
    ).toBe('');
  });

  it('sets isInternalNote to false when close is triggered', async () => {
    resetTextareaVisibility();
    const messageManagerStore = useMessageManager();
    messageManagerStore.isInternalNote = true;

    const wrapper = createWrapper();
    await wrapper.find('[data-icon="close"]').trigger('click');

    expect(messageManagerStore.isInternalNote).toBe(false);
  });

  it('appends pasted images to mediaUploadFiles', async () => {
    resetTextareaVisibility();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';

    const file = new File(['img'], 'clip.png', { type: 'image/png' });
    const item = {
      type: 'image/png',
      getAsFile: () => file,
    };

    const wrapper = createWrapper();
    const textarea = wrapper.find('[data-testid="text-area"]').element;
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { items: [item] },
    });

    textarea.dispatchEvent(pasteEvent);
    await flushPromises();

    expect(messageManagerStore.mediaUploadFiles).toHaveLength(1);
    expect(messageManagerStore.mediaUploadFiles[0].type).toBe('image/png');
  });

  it('exposes focus() to focus the textarea', async () => {
    resetTextareaVisibility();

    const wrapper = createWrapper();
    const element = wrapper.find('[data-testid="text-area"]').element;
    const focusSpy = vi.spyOn(element, 'focus');

    wrapper.vm.focus();
    await flushPromises();

    expect(focusSpy).toHaveBeenCalled();
    focusSpy.mockRestore();
  });
});
