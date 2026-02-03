import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { mount, flushPromises, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ChatMessageAudio from '../ChatMessageAudio.vue';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import audioTranscriptionService from '@/services/api/resources/chats/audioTranscription';
import { UnnnicCallAlert, UnnnicAudioRecorder } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  vi.restoreAllMocks();
});

vi.mock('@/services/api/resources/chats/audioTranscription', () => ({
  default: {
    generateAudioTranscription: vi.fn(),
    sendAudioTranscriptionFeedback: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    UnnnicCallAlert: vi.fn(),
  };
});

vi.mock('../FeedbackModal.vue', () => ({
  default: {
    name: 'TranscriptionFeedbackModal',
    template: `
      <div data-testid="transcription-feedback-modal" @click="$emit('close', $event)">
        <slot />
      </div>
    `,
    props: ['messageUuid'],
    emits: ['close'],
  },
}));

const createMessage = (overrides = {}) => ({
  uuid: 'msg-uuid-123',
  contact: { uuid: 'contact-123' },
  media: [
    {
      url: 'https://example.com/audio.mp3',
      preview: null,
      transcription: null,
    },
  ],
  ...overrides,
});

const defaultProps = {
  message: createMessage(),
  messageStatus: 'SENT',
  isClosedChat: false,
};

describe('ChatMessageAudio', () => {
  let wrapper;
  let pinia;
  let roomMessagesStore;

  const mountComponent = (props = {}, options = {}) => {
    return mount(ChatMessageAudio, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        stubs: {
          ...options.global?.stubs,
        },
        ...options.global,
      },
      ...options,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pinia = createPinia();
    setActivePinia(pinia);
    roomMessagesStore = useRoomMessages();
    vi.spyOn(roomMessagesStore, 'updateMessage').mockImplementation(() => {});
  });

  describe('render', () => {
    it('renders the component', () => {
      wrapper = mountComponent();
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.unnnic-audio-recorder').exists()).toBe(true);
    });

    it('passes message media url to UnnnicAudioRecorder', () => {
      const message = createMessage({
        media: [{ url: 'https://custom-audio.mp3', preview: null }],
      });
      wrapper = mountComponent({ message });
      const recorder = wrapper.findComponent(UnnnicAudioRecorder);
      expect(recorder.props('src')).toBe('https://custom-audio.mp3');
    });

    it('passes messageStatus to UnnnicAudioRecorder', () => {
      wrapper = mountComponent({ messageStatus: 'PENDING' });
      const recorder = wrapper.findComponent(UnnnicAudioRecorder);
      expect(recorder.props('reqStatus')).toBe('PENDING');
    });

    it('does not render TranscriptionFeedbackModal by default', () => {
      wrapper = mountComponent();
      expect(
        wrapper.find('[data-testid="transcription-feedback-modal"]').exists(),
      ).toBe(false);
    });
  });

  describe('canShowTranscriptionAudioAction', () => {
    it('shows transcription action when message has contact', () => {
      wrapper = mountComponent({
        message: createMessage({ contact: { uuid: 'c1' } }),
      });
      const recorder = wrapper.findComponent(UnnnicAudioRecorder);
      expect(recorder.props('showTranscriptionAction')).toBe(true);
    });

    it('hides transcription action when message has no contact', () => {
      wrapper = mountComponent({
        message: createMessage({ contact: null }),
      });
      const recorder = wrapper.findComponent(UnnnicAudioRecorder);
      expect(recorder.props('showTranscriptionAction')).toBe(false);
    });
  });

  describe('failed-click emit', () => {
    it('emits failed-click when UnnnicAudioRecorder emits failed-click', async () => {
      wrapper = mountComponent();
      const recorder = wrapper.findComponent(UnnnicAudioRecorder);
      await recorder.vm.$emit('failed-click');
      expect(wrapper.emitted('failed-click')).toHaveLength(1);
    });
  });

  describe('transcription', () => {
    it('calls generateAudioTranscription when showTranscriptionText becomes true', async () => {
      audioTranscriptionService.generateAudioTranscription.mockResolvedValue(
        {},
      );
      wrapper = mountComponent();
      const recorder = wrapper.findComponent(UnnnicAudioRecorder);
      await recorder.vm.$emit('update:show-transcription-text', true);
      await flushPromises();
      expect(
        audioTranscriptionService.generateAudioTranscription,
      ).toHaveBeenCalledWith('msg-uuid-123');
    });

    it('updates store with FAILED transcription when generateAudioTranscription fails', async () => {
      audioTranscriptionService.generateAudioTranscription.mockRejectedValue(
        new Error('API error'),
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const message = createMessage();
      wrapper = mountComponent({ message });
      const recorder = wrapper.findComponent(UnnnicAudioRecorder);
      await recorder.vm.$emit('update:show-transcription-text', true);
      await flushPromises();
      expect(roomMessagesStore.updateMessage).toHaveBeenCalledWith({
        reorderMessageMinute: true,
        message: {
          ...message,
          media: [
            {
              ...message.media[0],
              transcription: { status: 'FAILED', text: '' },
            },
          ],
        },
      });
      consoleSpy.mockRestore();
    });
  });

  describe('feedback (handleLike)', () => {
    it('calls sendAudioTranscriptionFeedback and UnnnicCallAlert when liked is true', async () => {
      audioTranscriptionService.sendAudioTranscriptionFeedback.mockResolvedValue(
        {},
      );
      const message = createMessage({
        media: [
          {
            url: 'https://audio.mp3',
            preview: null,
            transcription: { text: 'Hi', feedback: {} },
          },
        ],
      });
      wrapper = mountComponent({ message });
      wrapper.vm.handleLike(true);
      await flushPromises();
      expect(
        audioTranscriptionService.sendAudioTranscriptionFeedback,
      ).toHaveBeenCalledWith('msg-uuid-123', { liked: true });
      expect(UnnnicCallAlert).toHaveBeenCalled();
    });

    it('opens feedback modal when liked is false', async () => {
      const message = createMessage({
        media: [
          {
            url: 'https://audio.mp3',
            preview: null,
            transcription: { text: 'Hi', feedback: {} },
          },
        ],
      });
      wrapper = mountComponent({ message });
      wrapper.vm.handleLike(false);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.showFeedbackModal).toBe(true);
      expect(
        wrapper.find('[data-testid="transcription-feedback-modal"]').exists(),
      ).toBe(true);
    });

    it('resets transcriptionFeedback and calls UnnnicCallAlert on send feedback error', async () => {
      audioTranscriptionService.sendAudioTranscriptionFeedback.mockRejectedValue(
        new Error('Network error'),
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const message = createMessage({
        media: [
          {
            url: 'https://audio.mp3',
            preview: null,
            transcription: { text: 'Hi', feedback: { liked: true } },
          },
        ],
      });
      wrapper = mountComponent({ message });
      wrapper.vm.handleLike(true);
      await flushPromises();
      expect(UnnnicCallAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'error' }),
        }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('handleCloseFeedbackModal', () => {
    it('closes modal and resets feedback when reset is true', async () => {
      const message = createMessage({
        media: [
          {
            url: 'https://audio.mp3',
            preview: null,
            transcription: { text: 'Hi', feedback: { liked: false } },
          },
        ],
      });
      wrapper = mountComponent({ message });
      wrapper.vm.showFeedbackModal = true;
      await wrapper.vm.$nextTick();
      wrapper.vm.handleCloseFeedbackModal({ reset: true });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.showFeedbackModal).toBe(false);
    });

    it('closes modal without reset when reset is not passed', async () => {
      wrapper = mountComponent();
      wrapper.vm.showFeedbackModal = true;
      await wrapper.vm.$nextTick();
      wrapper.vm.handleCloseFeedbackModal({});
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.showFeedbackModal).toBe(false);
    });
  });

  describe('isClosedChat', () => {
    it('passes isClosedChat to UnnnicAudioRecorder context via canGenerateTranscriptionAudio', () => {
      wrapper = mountComponent({ isClosedChat: true });
      const recorder = wrapper.findComponent(UnnnicAudioRecorder);
      expect(recorder.props('enableGenerateTranscription')).toBeDefined();
    });
  });
});
