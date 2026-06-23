import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import TextBox from '../index.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/aiTextImprovement', () => ({
  default: { improve: vi.fn() },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({ default: vi.fn() }));

vi.mock('../Medias.vue', () => ({
  default: {
    name: 'MessageManagerTextBoxMedias',
    template: '<div data-testid="medias" />',
  },
}));

vi.mock('../AudioRecorder.vue', () => ({
  default: {
    name: 'MessageManagerTextBoxAudioRecorder',
    template: '<div data-testid="audio-recorder" />',
    methods: { record: vi.fn() },
  },
}));

vi.mock('../Actions/index.vue', () => ({
  default: {
    name: 'MessageManagerTextBoxActions',
    template: `<div data-testid="actions">
      <button data-testid="send-btn" @click="$emit('send')" />
      <button data-testid="improvement-received-btn" @click="$emit('improvementReceived', 'improved text')" />
      <button data-testid="improvement-cancelled-btn" @click="$emit('improvementCancelled')" />
    </div>`,
    emits: [
      'startAudioRecording',
      'openUploadFiles',
      'focusInput',
      'send',
      'improvementReceived',
      'improvementCancelled',
    ],
  },
}));

vi.mock('../UploadField.vue', () => ({
  default: {
    name: 'MessageManagerTextBoxUploadField',
    template: '<div data-testid="upload-field" />',
    methods: { clickInput: vi.fn() },
  },
}));

vi.mock('../TextArea.vue', () => ({
  default: {
    name: 'MessageManagerTextBoxTextArea',
    template: '<div data-testid="text-area" />',
    emits: ['keydown'],
    methods: { focus: vi.fn() },
  },
}));

vi.mock('../BackToOriginal.vue', () => ({
  default: {
    name: 'BackToOriginal',
    template:
      '<div data-testid="back-to-original" @click="$emit(\'reverted\')" />',
    emits: ['reverted'],
  },
}));

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const createWrapper = (options = {}) => {
  const {
    inputMessage = '',
    isAiLoading = false,
    improvedText = '',
    originalText = '',
    isInternalNote = false,
    mediaUploadFiles = [],
    activeRoomUuid = 'room-1',
  } = options;

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      messageManager: {
        inputMessage,
        isInternalNote,
        mediaUploadFiles,
        audioMessage: null,
        audioRecorderStatus: 'idle',
        isEmojiPickerOpen: false,
        inputMessageFocused: false,
        isSuggestionBoxOpen: false,
        isCopilotOpen: false,
        replyMessage: null,
      },
      aiTextImprovement: {
        isLoading: isAiLoading,
        improvedText,
        originalText,
        feedbackStatus: improvedText ? 'USED' : null,
      },
      rooms: {
        activeRoom: activeRoomUuid ? { uuid: activeRoomUuid } : null,
      },
    },
  });
  setActivePinia(pinia);

  return mount(TextBox, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: {
        UnnnicEmojiPicker: {
          name: 'UnnnicEmojiPicker',
          template: '<div data-testid="emoji-picker" />',
        },
      },
    },
  });
};

describe('TextBox (index.vue)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BackToOriginal visibility', () => {
    it('should show BackToOriginal when there is improved text and not loading', () => {
      const wrapper = createWrapper({
        improvedText: 'improved',
        originalText: 'original',
      });
      expect(wrapper.find('[data-testid="back-to-original"]').exists()).toBe(
        true,
      );
    });

    it('should hide BackToOriginal when loading', () => {
      const wrapper = createWrapper({
        improvedText: 'improved',
        isAiLoading: true,
      });
      expect(wrapper.find('[data-testid="back-to-original"]').exists()).toBe(
        false,
      );
    });

    it('should hide BackToOriginal when no improved text', () => {
      const wrapper = createWrapper({ improvedText: '' });
      expect(wrapper.find('[data-testid="back-to-original"]').exists()).toBe(
        false,
      );
    });

    it('should show textarea wrapper with back modifier when BackToOriginal is visible', () => {
      const wrapper = createWrapper({
        improvedText: 'improved',
        originalText: 'original',
      });
      expect(
        wrapper.find('.text-box__textarea-wrapper--with-back').exists(),
      ).toBe(true);
    });

    it('should not show textarea wrapper with back modifier when BackToOriginal is hidden', () => {
      const wrapper = createWrapper({ improvedText: '' });
      expect(
        wrapper.find('.text-box__textarea-wrapper--with-back').exists(),
      ).toBe(false);
    });
  });

  describe('AI improvement events', () => {
    it('should set inputMessage when improvementReceived is emitted', async () => {
      const wrapper = createWrapper({ inputMessage: 'original' });
      const store = useMessageManager();

      await wrapper
        .find('[data-testid="improvement-received-btn"]')
        .trigger('click');

      expect(store.inputMessage).toBe('improved text');
    });

    it('should restore original text when improvementCancelled is emitted', async () => {
      const wrapper = createWrapper({
        inputMessage: 'current',
        originalText: 'the original',
        improvedText: 'the improved',
      });
      const store = useMessageManager();

      await wrapper
        .find('[data-testid="improvement-cancelled-btn"]')
        .trigger('click');

      expect(store.inputMessage).toBe('the original');
    });
  });

  describe('CSS classes', () => {
    it('should add ai-improving class when loading', () => {
      const wrapper = createWrapper({ isAiLoading: true });
      expect(wrapper.find('.text-box--ai-improving').exists()).toBe(true);
    });

    it('should not add ai-improving class when not loading', () => {
      const wrapper = createWrapper({ isAiLoading: false });
      expect(wrapper.find('.text-box--ai-improving').exists()).toBe(false);
    });

    it('should add internal-note class when in internal note mode', () => {
      const wrapper = createWrapper({ isInternalNote: true });
      expect(wrapper.find('.internal-note').exists()).toBe(true);
    });
  });

  describe('TextArea rendering', () => {
    it('should always render TextArea component', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="text-area"]').exists()).toBe(true);
    });
  });

  describe('handleSend', () => {
    const stubNestedSends = () => {
      const roomMessagesStore = useRoomMessages();
      const discussionMessagesStore = useDiscussionMessages();
      roomMessagesStore.sendRoomMessage = vi.fn(() => Promise.resolve());
      roomMessagesStore.sendRoomMedias = vi.fn(() => Promise.resolve());
      roomMessagesStore.sendRoomInternalNote = vi.fn(() => Promise.resolve());
      discussionMessagesStore.sendDiscussionMessage = vi.fn(() =>
        Promise.resolve(),
      );
      discussionMessagesStore.sendDiscussionMedias = vi.fn(() =>
        Promise.resolve(),
      );
    };

    it('should send room message with active room uuid when there are no media files', async () => {
      const wrapper = createWrapper({
        inputMessage: 'Hello',
        activeRoomUuid: 'room-1',
      });
      stubNestedSends();
      const store = useMessageManager();

      await wrapper.find('[data-testid="send-btn"]').trigger('click');

      expect(store.sendMediasMessage).not.toHaveBeenCalled();
      expect(store.sendRoomMessage).toHaveBeenCalledWith('room-1');
    });

    it('should send medias message with active room uuid when there are media files', async () => {
      const file = new File(['x'], 'image.png', { type: 'image/png' });
      const wrapper = createWrapper({
        mediaUploadFiles: [file],
        activeRoomUuid: 'room-1',
      });
      stubNestedSends();
      const store = useMessageManager();

      await wrapper.find('[data-testid="send-btn"]').trigger('click');

      expect(store.sendRoomMessage).not.toHaveBeenCalled();
      expect(store.sendMediasMessage).toHaveBeenCalledWith('room-1');
    });

    it('should pass undefined room uuid when there is no active room', async () => {
      const wrapper = createWrapper({
        inputMessage: 'Hello',
        activeRoomUuid: null,
      });
      stubNestedSends();
      const store = useMessageManager();

      await wrapper.find('[data-testid="send-btn"]').trigger('click');

      expect(store.sendRoomMessage).toHaveBeenCalledWith(undefined);
    });
  });

  describe('internal note mode', () => {
    it('should reset AI store when isInternalNote becomes true', async () => {
      const wrapper = createWrapper({
        improvedText: 'improved',
        originalText: 'original',
        isAiLoading: true,
      });
      const messageManagerStore = useMessageManager();
      const aiStore = useAiTextImprovement();

      messageManagerStore.isInternalNote = true;
      await wrapper.vm.$nextTick();

      expect(aiStore.improvedText).toBe('');
      expect(aiStore.isLoading).toBe(false);
    });

    it('should hide BackToOriginal when isInternalNote is true with improved text', () => {
      const wrapper = createWrapper({
        improvedText: 'improved',
        originalText: 'original',
        isInternalNote: true,
      });

      expect(wrapper.find('[data-testid="back-to-original"]').exists()).toBe(
        false,
      );
    });
  });
});
