import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
  afterEach,
} from 'vitest';
import { mount, flushPromises, config } from '@vue/test-utils';
import FeedbackModal from '../FeedbackModal.vue';
import audioTranscriptionService from '@/services/api/resources/chats/audioTranscription';
import { UnnnicCallAlert } from '@weni/unnnic-system';
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
    getAudioTranscriptionFeedbackTags: vi.fn(),
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

const defaultFeedbackTagsResponse = {
  results: {
    'tag-uuid-1': 'Incorrect words',
    'tag-uuid-2': 'Missing content',
  },
};

const createDialogStubs = () => ({
  UnnnicDialog: {
    name: 'UnnnicDialogStub',
    props: ['open'],
    emits: ['update:open'],
    template: `
      <div v-if="open" data-testid="feedback-modal" v-bind="$attrs">
        <slot />
      </div>
    `,
  },
  UnnnicDialogContent: {
    name: 'UnnnicDialogContentStub',
    template: '<div data-testid="feedback-modal-content"><slot /></div>',
  },
  UnnnicDialogHeader: {
    name: 'UnnnicDialogHeaderStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogTitle: {
    name: 'UnnnicDialogTitleStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogFooter: {
    name: 'UnnnicDialogFooterStub',
    template: `
      <div>
        <slot />
      </div>
    `,
  },
  UnnnicButton: {
    name: 'UnnnicButtonStub',
    props: ['text', 'disabled', 'loading'],
    template: `
      <button
        :data-testid="text === 'submit' ? 'modal-primary-button' : 'modal-close'"
        :disabled="disabled"
        @click="$emit('click')"
      >
        <slot />{{ text }}
      </button>
    `,
  },
});

describe('FeedbackModal (TranscriptionFeedbackModal)', () => {
  let wrapper;

  const mountComponent = (props = {}, options = {}) => {
    return mount(FeedbackModal, {
      props: {
        messageUuid: 'msg-uuid-123',
        modelValue: true,
        ...props,
      },
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          ...createDialogStubs(),
          UnnnicSkeletonLoading: {
            name: 'UnnnicSkeletonLoadingStub',
            template: '<div class="skeleton-stub" />',
          },
          UnnnicTextArea: {
            name: 'UnnnicTextAreaStub',
            props: ['modelValue', 'placeholder', 'label', 'maxLength'],
            template: `
              <textarea
                data-testid="feedback-textarea"
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
              />
            `,
          },
          teleport: true,
        },
        ...options.global,
      },
      ...options,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    audioTranscriptionService.getAudioTranscriptionFeedbackTags.mockResolvedValue(
      defaultFeedbackTagsResponse,
    );
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('render', () => {
    it('renders the modal with correct title and content', async () => {
      wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(
        true,
      );
      expect(
        wrapper.find('[data-testid="feedback-modal-content"]').exists(),
      ).toBe(true);
    });

    it('shows TagGroup and textarea after categories load', async () => {
      wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.find('.tag-group').exists()).toBe(true);
      expect(wrapper.find('[data-testid="feedback-textarea"]').exists()).toBe(
        true,
      );
    });

    it('calls getAudioTranscriptionFeedbackTags on mount', async () => {
      wrapper = mountComponent();
      await flushPromises();

      expect(
        audioTranscriptionService.getAudioTranscriptionFeedbackTags,
      ).toHaveBeenCalledTimes(1);
    });

    it('passes messageUuid prop correctly', () => {
      wrapper = mountComponent({ messageUuid: 'custom-msg-uuid' });
      expect(wrapper.props('messageUuid')).toBe('custom-msg-uuid');
    });
  });

  describe('primary button state', () => {
    it('disables submit when no category and no text', async () => {
      wrapper = mountComponent();
      await flushPromises();

      const primaryButton = wrapper.find(
        '[data-testid="modal-primary-button"]',
      );
      expect(primaryButton.attributes('disabled')).toBeDefined();
    });

    it('enables submit when text is filled', async () => {
      wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.feedbackText = 'Some feedback text';

      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find(
        '[data-testid="modal-primary-button"]',
      );

      expect(primaryButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('handleCancel', () => {
    it('emits close with reset when cancel button is clicked', async () => {
      wrapper = mountComponent();
      await flushPromises();

      const cancelButton = wrapper.findAll('[data-testid="modal-close"]');
      await cancelButton[0].trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')[0]).toEqual([{ reset: true }]);
    });
  });

  describe('handleSubmit', () => {
    it('sends feedback and emits close on success', async () => {
      audioTranscriptionService.sendAudioTranscriptionFeedback.mockResolvedValue(
        {},
      );
      wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.feedbackText = 'The transcription was wrong';

      await wrapper.vm.$nextTick();

      await wrapper
        .find('[data-testid="modal-primary-button"]')
        .trigger('click');

      await flushPromises();

      expect(
        audioTranscriptionService.sendAudioTranscriptionFeedback,
      ).toHaveBeenCalledWith('msg-uuid-123', {
        liked: false,
        tags: [],
        text: 'The transcription was wrong',
      });
      expect(UnnnicCallAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'success' }),
        }),
      );
      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')[0]).toEqual([]);
    });

    it('sends selected category tags on submit', async () => {
      audioTranscriptionService.sendAudioTranscriptionFeedback.mockResolvedValue(
        {},
      );
      wrapper = mountComponent();
      await flushPromises();

      await wrapper.find('[data-testid="tag__tag-uuid-1"]').trigger('click');

      await wrapper
        .find('[data-testid="modal-primary-button"]')
        .trigger('click');
      await flushPromises();

      expect(
        audioTranscriptionService.sendAudioTranscriptionFeedback,
      ).toHaveBeenCalledWith(
        'msg-uuid-123',
        expect.objectContaining({
          liked: false,
          tags: ['tag-uuid-1'],
          text: '',
        }),
      );
    });

    it('shows error alert and does not emit close on submit error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      audioTranscriptionService.sendAudioTranscriptionFeedback.mockRejectedValue(
        new Error('Network error'),
      );
      wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.feedbackText = 'Feedback';

      await wrapper.vm.$nextTick();

      await wrapper
        .find('[data-testid="modal-primary-button"]')
        .trigger('click');
      await flushPromises();

      expect(UnnnicCallAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({ type: 'error' }),
        }),
      );
      expect(wrapper.emitted('close')).toBeFalsy();
      consoleSpy.mockRestore();
    });
  });

  describe('getFeedbackCategory error', () => {
    it('emits close with reset when loading categories fails', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      audioTranscriptionService.getAudioTranscriptionFeedbackTags.mockRejectedValue(
        new Error('Failed to load tags'),
      );
      wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')[0]).toEqual([{ reset: true }]);
      consoleSpy.mockRestore();
    });
  });
});
