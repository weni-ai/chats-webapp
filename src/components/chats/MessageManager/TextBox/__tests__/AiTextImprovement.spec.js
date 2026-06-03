import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/aiTextImprovement', () => ({
  default: { improve: vi.fn() },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({ default: vi.fn() }));

const UnnnicSystemPlugin = config.global.plugins.find(
  (p) => p !== i18n && typeof p !== 'function',
);

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n && plugin !== UnnnicSystemPlugin,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  if (
    UnnnicSystemPlugin &&
    config.global.plugins &&
    !config.global.plugins.includes(UnnnicSystemPlugin)
  ) {
    config.global.plugins.push(UnnnicSystemPlugin);
  }
});

vi.spyOn(i18n.global, 't').mockImplementation((key) => key);

const unnnicStubs = {
  UnnnicButton: {
    name: 'UnnnicButton',
    inheritAttrs: false,
    template:
      '<button :data-icon="iconCenter || iconLeft" :data-disabled="String(disabled)" :data-type="type" :data-text="text" @click="$emit(\'click\')"><slot /></button>',
    props: {
      iconCenter: { default: '' },
      iconLeft: { default: '' },
      type: { default: '' },
      size: { default: '' },
      disabled: { default: false },
      pressed: { default: false },
      text: { default: '' },
      tooltip: { default: '' },
    },
    emits: ['click'],
  },
  UnnnicToolTip: {
    name: 'UnnnicToolTip',
    template: '<div class="unnnic-tooltip-stub"><slot /></div>',
    props: ['enabled', 'text', 'side'],
  },
  UnnnicPopover: {
    name: 'UnnnicPopover',
    template: '<div class="mock-popover"><slot /></div>',
    props: ['open'],
  },
  UnnnicPopoverTrigger: {
    name: 'UnnnicPopoverTrigger',
    template: '<div class="mock-popover-trigger"><slot /></div>',
  },
  UnnnicPopoverContent: {
    name: 'UnnnicPopoverContent',
    template: '<div class="mock-popover-content"><slot /></div>',
    props: ['size', 'side', 'align'],
  },
};

let AiTextImprovement;

beforeAll(async () => {
  const mod = await import('../AiTextImprovement.vue');
  AiTextImprovement = mod.default;
});

const createWrapper = (options = {}) => {
  const { inputMessage = '', isLoading = false, showNewTag = true } = options;

  const pinia = createPinia();
  setActivePinia(pinia);

  const aiStore = useAiTextImprovement();
  aiStore.isLoading = isLoading;
  aiStore.showNewTag = showNewTag;

  const msgStore = useMessageManager();
  msgStore.inputMessage = inputMessage;

  return mount(AiTextImprovement, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: unnnicStubs,
    },
  });
};

describe('AiTextImprovement', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('default state (not loading)', () => {
    it('should render wand_shine button', () => {
      const wrapper = createWrapper({ inputMessage: 'hello' });
      const button = wrapper.find(
        '.ai-text-improvement__button-wrapper button',
      );
      expect(button.exists()).toBe(true);
      expect(button.attributes('data-icon')).toBe('wand_shine');
    });

    it('should disable button when inputMessage is empty', () => {
      const wrapper = createWrapper({ inputMessage: '' });
      const button = wrapper.find(
        '.ai-text-improvement__button-wrapper button',
      );
      expect(button.attributes('data-disabled')).toBe('true');
    });

    it('should enable button when inputMessage has text', () => {
      const wrapper = createWrapper({ inputMessage: 'hello' });
      const button = wrapper.find(
        '.ai-text-improvement__button-wrapper button',
      );
      expect(button.attributes('data-disabled')).toBe('false');
    });

    it('should render 3 improvement options in the popover', () => {
      const wrapper = createWrapper({ inputMessage: 'hello' });
      const items = wrapper.findAll('.ai-text-improvement__popover-item');
      expect(items).toHaveLength(3);
    });

    it('should show New tag when showNewTag is true', () => {
      const wrapper = createWrapper({ showNewTag: true });
      expect(wrapper.find('.ai-text-improvement__new-tag').exists()).toBe(true);
    });

    it('should not show New tag when showNewTag is false', () => {
      const wrapper = createWrapper({ showNewTag: false });
      expect(wrapper.find('.ai-text-improvement__new-tag').exists()).toBe(
        false,
      );
    });

    it('should hide New tag on mouseenter', async () => {
      const wrapper = createWrapper({ showNewTag: true });
      await wrapper.find('.ai-text-improvement').trigger('mouseenter');

      const store = useAiTextImprovement();
      expect(store.showNewTag).toBe(false);
    });
  });

  describe('loading state', () => {
    it('should show cancel button with close icon when loading', () => {
      const wrapper = createWrapper({
        isLoading: true,
        inputMessage: 'hello',
      });
      const cancelButton = wrapper.find(
        '.ai-text-improvement button[data-icon="close"]',
      );
      expect(cancelButton.exists()).toBe(true);
    });

    it('should not show popover/wand button when loading', () => {
      const wrapper = createWrapper({
        isLoading: true,
        inputMessage: 'hello',
      });
      expect(
        wrapper.find('.ai-text-improvement__button-wrapper').exists(),
      ).toBe(false);
    });

    it('should emit improvementCancelled on cancel click', async () => {
      const wrapper = createWrapper({
        isLoading: true,
        inputMessage: 'hello',
      });

      const cancelButton = wrapper.find(
        '.ai-text-improvement button[data-icon="close"]',
      );
      await cancelButton.trigger('click');

      expect(wrapper.emitted('improvementCancelled')).toBeTruthy();
    });
  });

  describe('selecting an option', () => {
    it('should call requestImprovement and emit improvementReceived on success', async () => {
      const wrapper = createWrapper({ inputMessage: 'hello' });
      const store = useAiTextImprovement();
      store.requestImprovement = vi.fn().mockResolvedValue('improved hello');

      const firstOption = wrapper.find('.ai-text-improvement__popover-item');
      await firstOption.trigger('click');
      await flushPromises();

      expect(store.requestImprovement).toHaveBeenCalledWith(
        'hello',
        'GRAMMAR_AND_SPELLING',
      );
      expect(wrapper.emitted('improvementReceived')?.[0]).toEqual([
        'improved hello',
      ]);
    });

    it('should emit improvementCancelled when requestImprovement returns null', async () => {
      const wrapper = createWrapper({ inputMessage: 'hello' });
      const store = useAiTextImprovement();
      store.requestImprovement = vi.fn().mockResolvedValue(null);

      const firstOption = wrapper.find('.ai-text-improvement__popover-item');
      await firstOption.trigger('click');
      await flushPromises();

      expect(wrapper.emitted('improvementCancelled')).toBeTruthy();
    });

    it('should not call requestImprovement when inputMessage is empty', async () => {
      const wrapper = createWrapper({ inputMessage: '   ' });
      const store = useAiTextImprovement();
      store.requestImprovement = vi.fn();

      const firstOption = wrapper.find('.ai-text-improvement__popover-item');
      if (firstOption.exists()) {
        await firstOption.trigger('click');
        await flushPromises();
      }

      expect(store.requestImprovement).not.toHaveBeenCalled();
    });
  });
});
