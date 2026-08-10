import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { ref } from 'vue';
import { mount, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import DictationAction from '../DictationAction.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import i18n from '@/plugins/i18n';

const { mockStart, mockStop, mockResult, mockError } = vi.hoisted(() => {
  const { ref: hoistedRef } = require('vue');
  return {
    mockStart: vi.fn(),
    mockStop: vi.fn(),
    mockResult: hoistedRef(''),
    mockError: hoistedRef(null),
  };
});

vi.mock('@/composables/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    result: mockResult,
    error: mockError,
    start: mockStart,
    stop: mockStop,
    isListening: ref(false),
    isSupported: { value: true },
    reset: vi.fn(),
  }),
  isSpeechRecognitionSupported: () => true,
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
  const { isDictationListening = false, inputMessage = '' } = options;

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      messageManager: {
        inputMessage,
        isDictationListening,
        isInternalNote: false,
        mediaUploadFiles: [],
        audioMessage: null,
        audioRecorderStatus: 'idle',
      },
      config: {
        project: { config: {} },
        status: 'ONLINE',
      },
    },
  });
  setActivePinia(pinia);

  return mount(DictationAction, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: {
        UnnnicToolTip: {
          name: 'UnnnicToolTip',
          template: '<div data-testid="tooltip"><slot /></div>',
          props: ['text', 'enabled', 'side'],
        },
        UnnnicButton: {
          name: 'UnnnicButton',
          inheritAttrs: false,
          template:
            '<button :data-disabled="disabled" :data-pressed="pressed" :data-icon="iconLeft" :data-text="text" @click="$emit(\'click\')" />',
          props: ['iconLeft', 'type', 'size', 'text', 'disabled', 'pressed'],
        },
      },
    },
  });
};

describe('DictationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResult.value = '';
    mockError.value = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(i18n.global, 't').mockImplementation((key) => key);
  });

  it('should render activate button when not listening', () => {
    const wrapper = createWrapper();
    const button = wrapper.find('button');

    expect(button.exists()).toBe(true);
    expect(button.attributes('data-text')).toBe(
      'message_dictation.button.activate',
    );
    expect(button.attributes('data-icon')).toBe('graphic_eq');
    expect(button.attributes('data-pressed')).toBe('false');
  });

  it('should render stop button when listening', () => {
    const wrapper = createWrapper({ isDictationListening: true });
    const button = wrapper.find('button');

    expect(button.attributes('data-text')).toBe(
      'message_dictation.button.stop',
    );
    expect(button.attributes('data-icon')).toBe(
      'svg-spinners:bars-scale-middle',
    );
    expect(button.attributes('data-pressed')).toBe('true');
  });

  it('should start dictation on click when idle', async () => {
    const wrapper = createWrapper();
    const messageStore = useMessageManager();

    await wrapper.find('button').trigger('click');

    expect(mockStart).toHaveBeenCalled();
    expect(messageStore.isDictationListening).toBe(true);
  });

  it('should stop dictation on click when listening', async () => {
    const wrapper = createWrapper({ isDictationListening: true });
    const messageStore = useMessageManager();

    await wrapper.find('button').trigger('click');

    expect(mockStop).toHaveBeenCalled();
    expect(messageStore.isDictationListening).toBe(false);
  });

  it('should start dictation with Shift+V shortcut', async () => {
    createWrapper();
    const messageStore = useMessageManager();

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'V',
        code: 'KeyV',
        shiftKey: true,
      }),
    );

    expect(mockStart).toHaveBeenCalled();
    expect(messageStore.isDictationListening).toBe(true);
  });

  it('should stop dictation with Escape when listening', async () => {
    createWrapper({ isDictationListening: true });
    const messageStore = useMessageManager();

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
      }),
    );

    expect(mockStop).toHaveBeenCalled();
    expect(messageStore.isDictationListening).toBe(false);
  });

  it('should update inputMessage when speech result changes', async () => {
    createWrapper();
    const messageStore = useMessageManager();

    mockResult.value = 'hello from speech';
    await Promise.resolve();

    expect(messageStore.inputMessage).toBe('hello from speech');
  });

  it('should stop listening when speech recognition errors', async () => {
    const wrapper = createWrapper({ isDictationListening: true });
    const messageStore = useMessageManager();

    mockError.value = 'not-allowed';
    await wrapper.vm.$nextTick();

    expect(messageStore.isDictationListening).toBe(false);
  });

  it('should remove keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const wrapper = createWrapper();

    wrapper.unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });
});
