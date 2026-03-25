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
import ViewOptions from '@/layouts/ChatsLayout/components/ViewOptions/index.vue';
import i18n from '@/plugins/i18n';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

describe('ViewOptions', () => {
  let wrapper;
  let localStorageMock;

  const stubs = {
    UnnnicSwitch: {
      template:
        '<input type="checkbox" data-testid="switch-sound" :model-value="modelValue" />',
      props: ['size', 'textRight', 'modelValue'],
    },
    UnnnicButton: {
      template: '<button><slot /></button>',
      props: ['text', 'iconLeft', 'type', 'size'],
    },
    teleport: true,
  };

  const createWrapper = (props = {}) =>
    mount(ViewOptions, {
      props,
      global: { mocks: { $t: (key) => key }, stubs },
    });

  const openDrawer = async (w) => {
    w.vm.openDrawer();
    await w.vm.$nextTick();
  };

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
      async ({ button, props, visible }) => {
        wrapper = createWrapper(props);
        await openDrawer(wrapper);
        expect(wrapper.find(`[data-testid="${button}"]`).exists()).toBe(
          visible,
        );
      },
    );

    it('should always render see history button', async () => {
      wrapper = createWrapper({ isViewMode: true });
      await openDrawer(wrapper);
      expect(wrapper.find('[data-testid="show-see_history"]').exists()).toBe(
        true,
      );
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

  describe('Drawer Interactions', () => {
    it('should toggle drawer open/close', async () => {
      wrapper = createWrapper();
      expect(wrapper.vm.isOpen).toBe(false);

      await wrapper.vm.openDrawer();
      expect(wrapper.vm.isOpen).toBe(true);

      await wrapper.vm.closeDrawer();
      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should close drawer when clicking outside', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openDrawer();
      expect(wrapper.vm.isOpen).toBe(true);

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        enumerable: true,
      });
      document.dispatchEvent(event);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(false);
    });
  });

  describe('Events & Navigation', () => {
    it('should emit open-flows-trigger', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openFlowsTrigger();
      expect(wrapper.emitted('open-flows-trigger')).toBeTruthy();
    });

    it('should emit show-quick-messages', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openQuickMessage();
      expect(wrapper.emitted('show-quick-messages')).toBeTruthy();
    });

    it.each([{ name: 'closed-rooms', testId: 'show-see_history', props: {} }])(
      'should navigate to $name when $testId is clicked',
      async ({ name, testId, props }) => {
        wrapper = createWrapper(props);
        await openDrawer(wrapper);
        await wrapper.find(`[data-testid="${testId}"]`).trigger('click');
        expect(mockPush).toHaveBeenCalledWith({ name });
      },
    );
  });

  describe('Lifecycle', () => {
    it('should clean up event listener on unmount', () => {
      const spy = vi.spyOn(document, 'removeEventListener');
      wrapper = createWrapper();
      wrapper.unmount();
      expect(spy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
});
