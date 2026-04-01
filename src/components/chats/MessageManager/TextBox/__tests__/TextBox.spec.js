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
import UnnnicSystemPlugin from '@/plugins/UnnnicSystem.js';
import MessageManagerTextBox from '../index.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';

const UnnnicEmojiPickerStub = {
  name: 'UnnnicEmojiPicker',
  template: '<div data-testid="stub-emoji-picker" />',
};

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n && plugin !== UnnnicSystemPlugin,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  if (!config.global.plugins.includes(UnnnicSystemPlugin)) {
    config.global.plugins.push(UnnnicSystemPlugin);
  }
});

describe('MessageManagerTextBox (index.vue)', () => {
  let pinia;
  let uploadClickInput;
  let audioRecord;
  let textareaFocus;

  beforeEach(() => {
    pinia = createTestingPinia({ stubActions: false });
    setActivePinia(pinia);
    uploadClickInput = vi.fn();
    audioRecord = vi.fn();
    textareaFocus = vi.fn();
  });

  const createWrapper = () =>
    mount(MessageManagerTextBox, {
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        components: {
          UnnnicEmojiPicker: UnnnicEmojiPickerStub,
        },
        stubs: {
          MessageManagerTextBoxUploadField: {
            name: 'MessageManagerTextBoxUploadField',
            template: '<div data-testid="stub-upload-field" />',
            methods: { clickInput: uploadClickInput },
          },
          MessageManagerTextBoxMedias: {
            name: 'MessageManagerTextBoxMedias',
            template: '<div data-testid="stub-medias" />',
          },
          MessageManagerTextBoxAudioRecorder: {
            name: 'MessageManagerTextBoxAudioRecorder',
            template: '<div data-testid="stub-audio-recorder" />',
            methods: { record: audioRecord },
          },
          MessageManagerTextBoxTextArea: {
            name: 'MessageManagerTextBoxTextArea',
            inheritAttrs: false,
            template:
              '<textarea data-testid="stub-textarea" @keydown="$emit(\'keydown\', $event)" />',
            methods: { focus: textareaFocus },
          },
          MessageManagerTextBoxActions: {
            name: 'MessageManagerTextBoxActions',
            template: `
              <div data-testid="stub-actions">
                <button type="button" data-testid="stub-send" @click="$emit('send')" />
                <button type="button" data-testid="stub-focus-input" @click="$emit('focus-input')" />
                <button type="button" data-testid="stub-start-audio" @click="$emit('start-audio-recording')" />
                <button type="button" data-testid="stub-open-upload" @click="$emit('open-upload-files')" />
              </div>
            `,
          },
        },
      },
    });

  const resetStoreForVisibleTextarea = () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [];
  };

  it('renders the text box root', () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.isInternalNote = false;
    messageManagerStore.inputMessageFocused = false;

    const wrapper = createWrapper();
    const root = wrapper.find('[data-testid="message-manager-text-box"]');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('text-box');
  });

  it('adds focused and internal-note classes from the store', () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.inputMessageFocused = true;
    messageManagerStore.isInternalNote = true;

    const wrapper = createWrapper();
    const root = wrapper.find('[data-testid="message-manager-text-box"]');
    expect(root.classes()).toContain('text-box--focused');
    expect(root.classes()).toContain('internal-note');
  });

  it('shows Medias when there are upload files', () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.mediaUploadFiles = [
      new File(['x'], 'a.png', { type: 'image/png' }),
    ];

    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="stub-medias"]').exists()).toBe(true);
  });

  it('hides Medias when there are no upload files', () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.mediaUploadFiles = [];

    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="stub-medias"]').exists()).toBe(false);
  });

  it('emits keydown and prevents default on Enter without Shift', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';

    const wrapper = createWrapper();
    const textarea = wrapper.find('[data-testid="stub-textarea"]');

    await textarea.trigger('keydown', { key: 'a' });
    expect(wrapper.emitted('keydown')).toHaveLength(1);
    expect(wrapper.emitted('keydown')[0][0].defaultPrevented).toBe(false);

    await textarea.trigger('keydown', { key: 'Enter', shiftKey: false });
    expect(wrapper.emitted('keydown')).toHaveLength(2);
    expect(wrapper.emitted('keydown')[1][0].defaultPrevented).toBe(true);

    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true });
    expect(wrapper.emitted('keydown')).toHaveLength(3);
    expect(wrapper.emitted('keydown')[2][0].defaultPrevented).toBe(false);
  });

  it('calls sendRoomMessage when send is triggered without media files', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = 'hello';
    messageManagerStore.mediaUploadFiles = [];
    const sendSpy = vi.spyOn(messageManagerStore, 'sendRoomMessage');
    const mediasSpy = vi.spyOn(messageManagerStore, 'sendMediasMessage');

    const wrapper = createWrapper();
    await wrapper.find('[data-testid="stub-send"]').trigger('click');
    await flushPromises();

    expect(sendSpy).toHaveBeenCalled();
    expect(mediasSpy).not.toHaveBeenCalled();
    sendSpy.mockRestore();
    mediasSpy.mockRestore();
  });

  it('calls sendMediasMessage when send is triggered with media files', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.mediaUploadFiles = [
      new File(['x'], 'a.png', { type: 'image/png' }),
    ];
    const sendSpy = vi.spyOn(messageManagerStore, 'sendRoomMessage');
    const mediasSpy = vi.spyOn(messageManagerStore, 'sendMediasMessage');

    const wrapper = createWrapper();
    await wrapper.find('[data-testid="stub-send"]').trigger('click');
    await flushPromises();

    expect(mediasSpy).toHaveBeenCalled();
    expect(sendSpy).not.toHaveBeenCalled();
    sendSpy.mockRestore();
    mediasSpy.mockRestore();
  });

  it('focuses the textarea when Actions emits focus-input', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';

    const wrapper = createWrapper();
    await wrapper.find('[data-testid="stub-focus-input"]').trigger('click');

    expect(textareaFocus).toHaveBeenCalled();
  });

  it('delegates start-audio-recording to the audio recorder', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';

    const wrapper = createWrapper();
    await wrapper.find('[data-testid="stub-start-audio"]').trigger('click');

    expect(audioRecord).toHaveBeenCalled();
  });

  it('delegates open-upload-files to the upload field', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';

    const wrapper = createWrapper();
    await wrapper.find('[data-testid="stub-open-upload"]').trigger('click');

    expect(uploadClickInput).toHaveBeenCalled();
  });

  it('appends emoji to the input when the emoji picker selects one', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = 'hi ';

    const wrapper = createWrapper();
    const picker = wrapper.findComponent(UnnnicEmojiPickerStub);
    expect(picker.exists()).toBe(true);
    picker.vm.$emit('emoji-selected', '🙂');
    await wrapper.vm.$nextTick();

    expect(messageManagerStore.inputMessage).toBe('hi 🙂');
  });

  it('clears textarea-related state when internal note is turned on', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = 'note text';
    messageManagerStore.audioMessage = document.createElement('audio');
    messageManagerStore.audioRecorderStatus = 'recording';
    messageManagerStore.isInternalNote = false;

    const wrapper = createWrapper();
    messageManagerStore.isInternalNote = true;
    await wrapper.vm.$nextTick();

    expect(messageManagerStore.inputMessage).toBe('');
    expect(messageManagerStore.audioMessage).toBeNull();
    expect(messageManagerStore.audioRecorderStatus).toBe('idle');
  });

  it('exposes focus that targets the textarea', async () => {
    resetStoreForVisibleTextarea();
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';

    const wrapper = createWrapper();
    await wrapper.vm.focus();

    expect(textareaFocus).toHaveBeenCalled();
  });
});
