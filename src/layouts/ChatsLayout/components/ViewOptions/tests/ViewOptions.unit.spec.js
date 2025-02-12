import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
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
  });

  describe('Snapshot', () => {
    it('should match the snapshot', () => {
      wrapper = createWrapper();
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
