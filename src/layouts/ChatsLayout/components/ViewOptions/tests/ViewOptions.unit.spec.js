import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import ViewOptions from '@/layouts/ChatsLayout/components/ViewOptions/index.vue';
import ViewButton from '@/layouts/ChatsLayout/components/ViewOptions/ViewButton.vue';
import i18n from '@/plugins/i18n';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

  beforeEach(() => {
    localStorageMock = {
      storage: {},
      getItem: vi.fn((key) => localStorageMock.storage[key]),
      setItem: vi.fn((key, value) => {
        localStorageMock.storage[key] = value;
      }),
      clear: vi.fn(() => {
        localStorageMock.storage = {};
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
  });

  const createWrapper = (props = {}) => {
    return mount(ViewOptions, {
      props,
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          ViewButton: ViewButton,
          UnnnicSwitch: {
            template: '<input type="checkbox" data-testid="switch-sound" />',
          },
          UnnnicButton: {
            template: '<button @click="handleClick"><slot /></button>',
            props: ['handleClick', 'expandedMore'],
          },
          teleport: true,
        },
      },
    });
  };

  describe('Props', () => {
    it('should receive showFlowsTriggerButton as true', () => {
      wrapper = createWrapper({ showFlowsTriggerButton: true });
      expect(wrapper.props('showFlowsTriggerButton')).toBe(true);
    });

    it('should receive dashboard as false', () => {
      wrapper = createWrapper({ dashboard: false });
      expect(wrapper.props('dashboard')).toBe(false);
    });

    it('should receive isViewMode as true', () => {
      wrapper = createWrapper({ isViewMode: true });
      expect(wrapper.props('isViewMode')).toBe(true);
    });
  });

  describe('Rendering Content', () => {
    it('should render UnnnicSwitch when isViewMode is false', async () => {
      wrapper = createWrapper({ isViewMode: false });
      wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="switch-sound"]').exists()).toBe(true);
    });

    it('should not render UnnnicSwitch when isViewMode is true', () => {
      wrapper = createWrapper({ isViewMode: true });
      expect(wrapper.find('[data-testid="switch-sound"]').exists()).toBe(false);
    });

    it('should update localStorage when changeSound is called', async () => {
      wrapper = createWrapper();

      wrapper.vm.sound = true;
      await wrapper.vm.changeSound();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chats_preferencesSound',
        'yes',
      );
      expect(localStorageMock.getItem('chats_preferencesSound')).toBe('yes');
      expect(wrapper.vm.sound).toBe(true);

      wrapper.vm.sound = false;
      await wrapper.vm.changeSound();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chats_preferencesSound',
        'no',
      );
      expect(localStorageMock.getItem('chats_preferencesSound')).toBe('no');
      expect(wrapper.vm.sound).toBe(false);
    });

    it('should pass the correct value to UnnnicSwitch v-model', async () => {
      wrapper = createWrapper({ isViewMode: false });
      wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      expect(
        wrapper.find('[data-testid="switch-sound"]').attributes('modelvalue'),
      ).toBe('true');
    });

    it('should update sound when UnnnicSwitch is toggled', async () => {
      wrapper = createWrapper({ isViewMode: false, sound: true });
      wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      const switchComponent = wrapper.findComponent(
        '[data-testid="switch-sound"]',
      );

      await switchComponent.setValue(false);
      expect(wrapper.vm.sound).toBe(false);
    });
  });

  describe('Events', () => {
    it('should open drawer when ViewButton is clicked', async () => {
      wrapper = createWrapper();
      await wrapper
        .find('[data-testid="view-btn"]')
        .find('button')
        .trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="drawer"]').exists()).toBe(true);
    });

    it('should emit open-flows-trigger when openFlowsTrigger is called', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openFlowsTrigger();
      expect(wrapper.emitted('open-flows-trigger')).toBeTruthy();
    });

    it('should emit show-quick-messages when openQuickMessage is called', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openQuickMessage();
      expect(wrapper.emitted('show-quick-messages')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should call router push when navigate is called', async () => {
      wrapper = createWrapper();
      await wrapper.vm.navigate('dashboard.manager');

      expect(mockPush).toHaveBeenCalledWith({
        name: 'dashboard.manager',
      });
    });
    it('should render dashboard button when dashboard is true', async () => {
      wrapper = createWrapper({ dashboard: true });
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="show-dashboard"]').exists()).toBe(
        true,
      );
    });

    it('should render dashboard button when isViewMode is false', async () => {
      wrapper = createWrapper({ isViewMode: false });
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="show-dashboard"]').exists()).toBe(
        true,
      );
    });

    it('should not render dashboard button when dashboard is false and isViewMode is true', () => {
      wrapper = createWrapper({ dashboard: false, isViewMode: true });
      expect(wrapper.find('[data-testid="show-dashboard"]').exists()).toBe(
        false,
      );
    });

    it('should call navigate when dashboard button is clicked', async () => {
      wrapper = createWrapper({ dashboard: true });
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      await wrapper.find('[data-testid="show-dashboard"]').trigger('click');
      expect(mockPush).toHaveBeenCalledWith({ name: 'dashboard.manager' });
    });

    it('should render the see history button', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="show-see_history"]').exists()).toBe(
        true,
      );
    });

    it('should call navigate when see history button is clicked', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      await wrapper.find('[data-testid="show-see_history"]').trigger('click');
      expect(mockPush).toHaveBeenCalledWith({ name: 'closed-rooms' });
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', () => {
      wrapper = createWrapper();
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe('Button Event Handlers', () => {
    it('should prevent mousedown default on flows trigger button', async () => {
      wrapper = createWrapper({ showFlowsTriggerButton: true });
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      const button = wrapper.find('[data-testid="show-flows-trigger"]');
      const preventDefault = vi.fn();

      await button.trigger('mousedown', { preventDefault });
      expect(preventDefault).toHaveBeenCalled();
    });

    it('should prevent mousedown default on quick messages button', async () => {
      wrapper = createWrapper({ isViewMode: false });
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      const button = wrapper.find('[data-testid="show-quick-messages"]');
      const preventDefault = vi.fn();

      await button.trigger('mousedown', { preventDefault });
      expect(preventDefault).toHaveBeenCalled();
    });

    it('should prevent mousedown default on dashboard button', async () => {
      wrapper = createWrapper({ dashboard: true });
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      const button = wrapper.find('[data-testid="show-dashboard"]');
      const preventDefault = vi.fn();

      await button.trigger('mousedown', { preventDefault });
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('Sound Switch Complete Interactions', () => {
    it('should handle full sound switch lifecycle', async () => {
      wrapper = createWrapper({ isViewMode: false });
      await wrapper.vm.openDrawer();
      await wrapper.vm.$nextTick();
      await wrapper
        .findComponent('[data-testid="switch-sound"]')
        .setValue(false);
      expect(wrapper.vm.sound).toBe(false);

      const switchComponent = wrapper.findComponent(
        '[data-testid="switch-sound"]',
      );
      await switchComponent.setValue(true);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.sound).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chats_preferencesSound',
        'yes',
      );

      await switchComponent.trigger('update:model-value', true);
      expect(wrapper.vm.sound).toBe(true);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should set initial sound value from localStorage on mount', async () => {
      localStorageMock.storage['chats_preferencesSound'] = 'yes';
      wrapper = createWrapper();

      expect(wrapper.vm.sound).toBe(true);
    });

    it('should default sound to true if no localStorage value exists', async () => {
      localStorageMock.storage = {};
      wrapper = createWrapper();

      expect(wrapper.vm.sound).toBe(true);
    });

    it('should clean up click event listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      wrapper = createWrapper();
      wrapper.unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
      );
    });
  });
});
