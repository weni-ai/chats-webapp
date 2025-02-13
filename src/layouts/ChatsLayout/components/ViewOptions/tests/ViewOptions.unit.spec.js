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
import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/services/api/websocket/soundNotification.js', () => ({
  PREFERENCES_SOUND: 'WENICHATS_PREFERENCES_SOUND',
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
            template: '<button><slot /></button>',
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
    it('should not show drawer when isOpen is false', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="drawer-overlay"]').exists()).toBe(
        false,
      );
    });

    it('should show drawer when isOpen is true', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openDrawer();
      expect(wrapper.find('[data-testid="drawer-overlay"]').exists()).toBe(
        true,
      );
    });

    it('should render UnnnicSwitch when isViewMode is false', () => {
      wrapper = createWrapper({ isViewMode: false });
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
        PREFERENCES_SOUND,
        'yes',
      );
      expect(localStorageMock.getItem(PREFERENCES_SOUND)).toBe('yes');
      expect(wrapper.vm.sound).toBe(true);

      wrapper.vm.sound = false;
      await wrapper.vm.changeSound();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        PREFERENCES_SOUND,
        'no',
      );
      expect(localStorageMock.getItem(PREFERENCES_SOUND)).toBe('no');
      expect(wrapper.vm.sound).toBe(false);
    });

    it('should pass the correct value to UnnnicSwitch v-model', () => {
      wrapper = createWrapper({ isViewMode: false, sound: true });
      expect(
        wrapper.find('[data-testid="switch-sound"]').attributes('modelvalue'),
      ).toBe('true');
    });

    it('should update sound when UnnnicSwitch is toggled', async () => {
      wrapper = createWrapper({ isViewMode: false, sound: false });
      const switchComponent = wrapper.findComponent(
        '[data-testid="switch-sound"]',
      );

      await switchComponent.setValue(true);
      expect(wrapper.vm.sound).toBe(true);
    });
    it('should update sound when UnnnicSwitch is toggled', async () => {
      wrapper = createWrapper({ isViewMode: false, sound: true });
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
      await wrapper.find('[data-testid="view-btn"]').trigger('click');
      expect(wrapper.find('[data-testid="drawer"]').exists()).toBe(true);
    });

    it('should close drawer when overlay is clicked', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openDrawer();
      await wrapper.find('[data-testid="drawer-overlay"]').trigger('click');
      expect(wrapper.find('[data-testid="drawer-overlay"]').exists()).toBe(
        false,
      );
    });

    it('should close drawer when function is called', async () => {
      wrapper = createWrapper();
      await wrapper.vm.openDrawer();
      expect(wrapper.find('[data-testid="drawer-overlay"]').exists()).toBe(
        true,
      );
      await wrapper.vm.closeDrawer();
      expect(wrapper.find('[data-testid="drawer-overlay"]').exists()).toBe(
        false,
      );
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
    it('should render dashboard button when dashboard is true', () => {
      wrapper = createWrapper({ dashboard: true });
      expect(wrapper.find('[data-testid="show-dashboard"]').exists()).toBe(
        true,
      );
    });

    it('should render dashboard button when isViewMode is false', () => {
      wrapper = createWrapper({ isViewMode: false });
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
      await wrapper.find('[data-testid="show-dashboard"]').trigger('click');
      expect(mockPush).toHaveBeenCalledWith({ name: 'dashboard.manager' });
    });

    it('should render the see history button', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="show-see_history"]').exists()).toBe(
        true,
      );
    });

    it('should call navigate when see history button is clicked', async () => {
      wrapper = createWrapper();
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
});
