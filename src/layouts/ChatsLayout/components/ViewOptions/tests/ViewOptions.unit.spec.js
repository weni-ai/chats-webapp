import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ViewOptions from '@/layouts/ChatsLayout/components/ViewOptions/index.vue';
import i18n from '@/plugins/i18n';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const UnnnicSystemPlugin = config.global.plugins.find(
  (p) => p !== i18n && typeof p !== 'function',
);

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n && plugin !== UnnnicSystemPlugin,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  if (
    UnnnicSystemPlugin &&
    !config.global.plugins.includes(UnnnicSystemPlugin)
  ) {
    config.global.plugins.push(UnnnicSystemPlugin);
  }
});

describe('ViewOptions', () => {
  let wrapper;
  let localStorageMock;

  const stubs = {
    UnnnicPopover: {
      name: 'UnnnicPopover',
      template: '<div><slot /></div>',
      props: ['open'],
      emits: ['update:open'],
    },
    UnnnicPopoverTrigger: {
      name: 'UnnnicPopoverTrigger',
      template: '<div data-testid="popover-trigger"><slot /></div>',
      props: ['asChild', 'as'],
    },
    UnnnicPopoverContent: {
      name: 'UnnnicPopoverContent',
      template: '<div v-bind="$attrs"><slot /></div>',
      props: ['side', 'align', 'sideOffset', 'width'],
    },
    UnnnicSwitch: {
      name: 'UnnnicSwitch',
      template:
        '<input type="checkbox" data-testid="switch-sound" :model-value="modelValue" />',
      props: ['size', 'textRight', 'modelValue'],
    },
    UnnnicButton: {
      name: 'UnnnicButton',
      template:
        '<button v-bind="$attrs" :type="\'button\'" :data-icon-left="iconLeft" :data-icon-right="iconRight" :data-type="type" @click="$emit(\'click\', $event)"><slot />{{ text }}</button>',
      props: [
        'text',
        'iconLeft',
        'iconRight',
        'iconCenter',
        'type',
        'size',
        'disabled',
        'loading',
        'pressed',
      ],
      emits: ['click'],
    },
    UnnnicIcon: {
      name: 'UnnnicIcon',
      template: '<i></i>',
      props: ['icon', 'size', 'scheme'],
    },
    UnnnicTag: {
      name: 'UnnnicTag',
      template: '<span></span>',
      props: ['type', 'text'],
    },
  };

  const createWrapper = (props = {}) =>
    mount(ViewOptions, {
      props,
      global: {
        mocks: { $t: (key) => key },
        stubs,
        plugins: [createTestingPinia({ stubActions: false })],
      },
    });

  beforeEach(() => {
    localStorageMock = {
      storage: {},
      getItem: vi.fn((key) => localStorageMock.storage[key]),
      setItem: vi.fn((key, value) => {
        localStorageMock.storage[key] = value;
      }),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });
    mockPush.mockClear();
  });

  describe('Button Visibility', () => {
    it.each([
      {
        button: 'show-flows-trigger',
        props: { showFlowsTriggerButton: true, isViewMode: true },
        visible: true,
      },
      {
        button: 'show-flows-trigger',
        props: { showFlowsTriggerButton: false, isViewMode: false },
        visible: true,
      },
      {
        button: 'show-flows-trigger',
        props: { showFlowsTriggerButton: false, isViewMode: true },
        visible: false,
      },
      {
        button: 'show-quick-messages',
        props: { isViewMode: false },
        visible: true,
      },
      {
        button: 'show-quick-messages',
        props: { isViewMode: true },
        visible: false,
      },
      {
        button: 'show-dashboard',
        props: { dashboard: true, isViewMode: true },
        visible: true,
      },
      {
        button: 'show-dashboard',
        props: { dashboard: false, isViewMode: false },
        visible: true,
      },
      {
        button: 'show-dashboard',
        props: { dashboard: false, isViewMode: true },
        visible: false,
      },
      {
        button: 'switch-sound',
        props: { isViewMode: false },
        visible: true,
      },
      {
        button: 'switch-sound',
        props: { isViewMode: true },
        visible: false,
      },
    ])(
      'should render $button=$visible with props $props',
      ({ button, props, visible }) => {
        wrapper = createWrapper(props);
        expect(wrapper.find(`[data-testid="${button}"]`).exists()).toBe(
          visible,
        );
      },
    );

    it('should always render see history button', () => {
      wrapper = createWrapper({ isViewMode: true });
      expect(wrapper.find('[data-testid="show-see_history"]').exists()).toBe(
        true,
      );
    });

    it('should render the popover trigger, content and button', () => {
      wrapper = createWrapper();
      expect(
        wrapper.find('[data-testid="view-options-popover"]').exists(),
      ).toBe(true);
      expect(wrapper.find('[data-testid="popover-trigger"]').exists()).toBe(
        true,
      );
      expect(
        wrapper.find('[data-testid="view-options-content"]').exists(),
      ).toBe(true);
      expect(wrapper.find('[data-testid="view-btn"]').exists()).toBe(true);
    });
  });

  describe('Sound Management', () => {
    it('should persist sound preference to localStorage', async () => {
      wrapper = createWrapper();
      wrapper.vm.sound = true;
      await wrapper.vm.changeSound();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chats_preferencesSound',
        'yes',
      );

      wrapper.vm.sound = false;
      await wrapper.vm.changeSound();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chats_preferencesSound',
        'no',
      );
    });

    it('should load sound preference from localStorage', () => {
      localStorageMock.storage['chats_preferencesSound'] = 'yes';
      wrapper = createWrapper();
      expect(wrapper.vm.sound).toBe(true);

      localStorageMock.storage = {};
      wrapper = createWrapper();
      expect(wrapper.vm.sound).toBe(true);
    });
  });

  describe('Popover State', () => {
    it('should start closed', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should sync open state through v-model:open on UnnnicPopover', async () => {
      wrapper = createWrapper();
      const popover = wrapper.find('[data-testid="view-options-popover"]');
      expect(popover.exists()).toBe(true);

      const popoverComponent = popover.getComponent({ name: 'UnnnicPopover' });
      popoverComponent.vm.$emit('update:open', true);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isOpen).toBe(true);
    });

    it('should clear the new badge the first time the trigger is clicked', async () => {
      delete localStorageMock.storage['chats_viewOptionsNewSeen'];
      wrapper = createWrapper();
      expect(wrapper.vm.showNewBadge).toBe(true);

      await wrapper.find('[data-testid="popover-trigger"]').trigger('click');
      expect(wrapper.vm.showNewBadge).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chats_viewOptionsNewSeen',
        'true',
      );
    });

    it('should not re-clear the new badge once already seen', async () => {
      localStorageMock.storage['chats_viewOptionsNewSeen'] = 'true';
      wrapper = createWrapper();
      expect(wrapper.vm.showNewBadge).toBe(false);

      await wrapper.find('[data-testid="popover-trigger"]').trigger('click');
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'chats_viewOptionsNewSeen',
        'true',
      );
    });
  });

  describe('Events & Navigation', () => {
    it('should emit open-flows-trigger and close popover', async () => {
      wrapper = createWrapper();
      wrapper.vm.isOpen = true;
      await wrapper.vm.openFlowsTrigger();
      expect(wrapper.emitted('open-flows-trigger')).toBeTruthy();
      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should emit show-quick-messages and close popover', async () => {
      wrapper = createWrapper();
      wrapper.vm.isOpen = true;
      await wrapper.vm.openQuickMessage();
      expect(wrapper.emitted('show-quick-messages')).toBeTruthy();
      expect(wrapper.vm.isOpen).toBe(false);
    });

    it.each([{ name: 'closed-rooms', testId: 'show-see_history', props: {} }])(
      'should navigate to $name when $testId is clicked',
      async ({ name, testId, props }) => {
        wrapper = createWrapper(props);
        await wrapper.find(`[data-testid="${testId}"]`).trigger('click');
        expect(mockPush).toHaveBeenCalledWith({ name });
      },
    );

    it('should post Dashboard navigation message and close popover', async () => {
      const postMessageSpy = vi
        .spyOn(window.parent, 'postMessage')
        .mockImplementation(() => {});

      wrapper = createWrapper({ dashboard: true });
      wrapper.vm.isOpen = true;
      await wrapper.find('[data-testid="show-dashboard"]').trigger('click');

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          event: 'redirect',
          path: 'insights:init/humanServiceDashboard',
        },
        '*',
      );
      expect(wrapper.vm.isOpen).toBe(false);

      postMessageSpy.mockRestore();
    });
  });

  describe('Theme Selector', () => {
    it('should render light and dark theme buttons', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="theme-light-button"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="theme-dark-button"]').exists()).toBe(
        true,
      );
    });

    it.each([
      { theme: 'light', selected: 'theme-light-button' },
      { theme: 'dark', selected: 'theme-dark-button' },
    ])(
      'should mark $selected as selected when theme is $theme',
      async ({ theme, selected }) => {
        wrapper = createWrapper();
        const targetTestId =
          theme === 'light' ? 'theme-light-button' : 'theme-dark-button';
        await wrapper.find(`[data-testid="${targetTestId}"]`).trigger('click');

        expect(
          wrapper
            .find(`[data-testid="${selected}"]`)
            .attributes('aria-pressed'),
        ).toBe('true');
      },
    );
  });
});
