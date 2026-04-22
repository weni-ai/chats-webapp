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

import BackToOriginal from '../BackToOriginal.vue';
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';
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
  const { originalText = 'original text', inputMessage = 'improved text' } =
    options;

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      messageManager: { inputMessage },
      aiTextImprovement: {
        originalText,
        improvedText: 'improved text',
        feedbackStatus: 'USED',
      },
    },
  });
  setActivePinia(pinia);

  return mount(BackToOriginal, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: {
        UnnnicButton: {
          name: 'UnnnicButton',
          template:
            '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
          props: ['iconLeft', 'type', 'size', 'text'],
        },
      },
    },
  });
};

describe('BackToOriginal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the undo button', () => {
    const wrapper = createWrapper();
    const button = wrapper.find('.back-to-original button');
    expect(button.exists()).toBe(true);
  });

  it('should render a button component', () => {
    const wrapper = createWrapper();
    const btn = wrapper.findComponent({ name: 'UnnnicButton' });
    expect(btn.exists()).toBe(true);
  });

  it('should restore original text and set DISCARDED on click', async () => {
    const wrapper = createWrapper();
    const aiStore = useAiTextImprovement();
    const messageStore = useMessageManager();

    await wrapper.find('.back-to-original button').trigger('click');

    expect(messageStore.inputMessage).toBe('original text');
    expect(aiStore.feedbackStatus).toBe('DISCARDED');
    expect(aiStore.improvedText).toBe('');
  });

  it('should emit reverted on click', async () => {
    const wrapper = createWrapper();

    await wrapper.find('.back-to-original button').trigger('click');

    expect(wrapper.emitted('reverted')).toBeTruthy();
    expect(wrapper.emitted('reverted').length).toBeGreaterThanOrEqual(1);
  });
});
