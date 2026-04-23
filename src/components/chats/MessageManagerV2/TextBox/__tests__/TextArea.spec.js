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

import TextArea from '../TextArea.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/aiTextImprovement', () => ({
  default: { improve: vi.fn() },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({ default: vi.fn() }));

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
    isAiImproving = false,
    isInternalNote = false,
    mediaUploadFiles = [],
  } = options;

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      messageManager: {
        inputMessage,
        isInternalNote,
        mediaUploadFiles,
        audioRecorderStatus: 'idle',
        inputMessageFocused: false,
      },
      aiTextImprovement: { isLoading: isAiImproving },
    },
  });
  setActivePinia(pinia);

  return mount(TextArea, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: {
        UnnnicIcon: {
          name: 'UnnnicIcon',
          template: '<span class="unnnic-icon" v-bind="$attrs" />',
          props: ['icon', 'size', 'scheme', 'clickable'],
        },
      },
    },
  });
};

describe('TextArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('default state', () => {
    it('should show the textarea when not loading', () => {
      const wrapper = createWrapper({ inputMessage: 'hello' });
      expect(wrapper.find('[data-testid="text-area"]').exists()).toBe(true);
    });

    it('should not show loading animation when not loading', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('.text-box__ai-loading-text').exists()).toBe(false);
    });

    it('should emit keydown on textarea keydown', async () => {
      const wrapper = createWrapper();
      const textarea = wrapper.find('[data-testid="text-area"]');
      await textarea.trigger('keydown', { key: 'a' });
      expect(wrapper.emitted('keydown')).toBeTruthy();
    });

    it('should update inputMessage on input', async () => {
      const wrapper = createWrapper();
      const store = useMessageManager();
      const textarea = wrapper.find('[data-testid="text-area"]');

      await textarea.setValue('new text');
      expect(store.inputMessage).toBe('new text');
    });
  });

  describe('AI loading state', () => {
    it('should show loading animation when AI is improving', () => {
      const wrapper = createWrapper({ isAiImproving: true });
      expect(wrapper.find('.text-box__ai-loading-text').exists()).toBe(true);
    });

    it('should show improving_response text', () => {
      const wrapper = createWrapper({ isAiImproving: true });
      expect(wrapper.find('.text-box__ai-loading-text').text()).toBe(
        'ai_text_improvement.improving_response',
      );
    });

    it('should show 3 jumping dots', () => {
      const wrapper = createWrapper({ isAiImproving: true });
      const dots = wrapper.findAll('.text-box__ai-loading-dot');
      expect(dots).toHaveLength(3);
    });

    it('should hide textarea when AI is improving', () => {
      const wrapper = createWrapper({ isAiImproving: true });
      expect(wrapper.find('[data-testid="text-area"]').exists()).toBe(false);
    });
  });

  describe('internal note', () => {
    it('should show internal note close button when isInternalNote', () => {
      const wrapper = createWrapper({ isInternalNote: true });
      expect(wrapper.find('.internal-note__close-button').exists()).toBe(true);
    });

    it('should show internal note prefix', () => {
      const wrapper = createWrapper({ isInternalNote: true });
      expect(wrapper.find('.internal-note__prefix').exists()).toBe(true);
    });
  });
});
