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

import Actions from '../Actions.vue';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/aiTextImprovement', () => ({
  default: { improve: vi.fn() },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({ default: vi.fn() }));

vi.mock('../AiTextImprovement.vue', () => ({
  default: {
    name: 'AiTextImprovement',
    template:
      '<div data-testid="ai-text-improvement" @click="$emit(\'improvementReceived\', \'improved\')" />',
    emits: ['improvementReceived', 'improvementCancelled'],
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

vi.spyOn(i18n.global, 't').mockImplementation((key) => key);

const createWrapper = (options = {}) => {
  const {
    featureFlags = { active_features: ['weniChatsAITextImprovement'] },
    activeDiscussion = null,
    inputMessage = '',
    isAiLoading = false,
    audioRecorderStatus = 'idle',
  } = options;

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      messageManager: {
        inputMessage,
        isInternalNote: false,
        isEmojiPickerOpen: false,
        audioRecorderStatus,
        audioMessage: null,
        mediaUploadFiles: [],
        isSuggestionBoxOpen: false,
      },
      aiTextImprovement: { isLoading: isAiLoading },
      featureFlag: { featureFlags },
      discussions: { activeDiscussion },
    },
  });
  setActivePinia(pinia);

  return mount(Actions, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: {
        UnnnicButton: {
          name: 'UnnnicButton',
          inheritAttrs: false,
          template:
            '<button :data-disabled="disabled" :data-text="text" @click="$emit(\'click\')"><slot /></button>',
          props: [
            'iconCenter',
            'iconLeft',
            'type',
            'size',
            'disabled',
            'pressed',
            'text',
            'tooltip',
          ],
        },
      },
    },
  });
};

describe('Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('action buttons', () => {
    it('should render all 5 action buttons in room mode', () => {
      const wrapper = createWrapper();
      const items = wrapper.findAll('.text-box__actions__item');
      expect(items).toHaveLength(5);
    });

    it('should hide discussion-only buttons in discussion mode', () => {
      const wrapper = createWrapper({
        activeDiscussion: { uuid: 'disc-1' },
      });
      const items = wrapper.findAll('.text-box__actions__item');
      expect(items).toHaveLength(3);
    });

    it('should emit send when send button is clicked', async () => {
      const wrapper = createWrapper();
      const sendButton = wrapper.find(
        '.text-box__actions > button[data-text="send"]',
      );
      await sendButton.trigger('click');
      expect(wrapper.emitted('send')).toBeTruthy();
    });
  });

  describe('AI text improvement visibility', () => {
    it('should show AiTextImprovement when feature flag is active', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('[data-testid="ai-text-improvement"]').exists()).toBe(
        true,
      );
    });

    it('should hide AiTextImprovement when feature flag is off', () => {
      const wrapper = createWrapper({
        featureFlags: { active_features: [] },
      });
      expect(wrapper.find('[data-testid="ai-text-improvement"]').exists()).toBe(
        false,
      );
    });

    it('should hide AiTextImprovement in discussion mode', () => {
      const wrapper = createWrapper({
        activeDiscussion: { uuid: 'disc-1' },
      });
      expect(wrapper.find('[data-testid="ai-text-improvement"]').exists()).toBe(
        false,
      );
    });
  });

  describe('AI loading state', () => {
    it('should disable send button when AI is loading', () => {
      const wrapper = createWrapper({ isAiLoading: true });
      const allButtons = wrapper.findAll('.text-box__actions > button');
      const sendButton = allButtons[allButtons.length - 1];
      expect(sendButton.attributes('data-disabled')).toBe('true');
    });
  });
});
