import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ViewModeHeader from '@/views/Dashboard/ViewMode/components/ViewModeHeader.vue';
import { useRooms } from '@/store/modules/chats/rooms';
import i18n from '@/plugins/i18n';

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

describe('ViewModeHeader', () => {
  const createWrapper = (props = {}, routeParams = {}) => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const mockRouter = { push: vi.fn() };
    const mockRoute = { params: routeParams };

    return mount(ViewModeHeader, {
      props: { viewedAgent: 'John Doe', ...props },
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key, params) => `${key}_${params?.viewedAgent || ''}`,
          $router: mockRouter,
          $route: mockRoute,
        },
        components: {
          UnnnicToolTip: config.global.stubs.UnnnicToolTip,
        },
        stubs: {
          UnnnicIcon: {
            template: '<span data-testid="icon" :data-icon="icon"></span>',
            props: ['icon', 'size'],
          },
        },
      },
    });
  };

  describe('Props and Initial State', () => {
    it('should handle props and initialize correctly', () => {
      const wrapper = createWrapper({ viewedAgent: 'Test Agent' });
      expect(wrapper.props('viewedAgent')).toBe('Test Agent');
      expect(wrapper.vm.isInsight).toBe(false);
    });
  });

  describe('Conditional Rendering', () => {
    it('should render header when viewedAgent is provided', () => {
      const wrapper = createWrapper({ viewedAgent: 'John Doe' });

      expect(wrapper.find('[data-testid="view-mode-header"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="header-title"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="visibility-icon"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="close-button"]').exists()).toBe(true);
      expect(
        wrapper.findComponent({ name: 'UnnnicToolTipStub' }).exists(),
      ).toBe(true);
      expect(wrapper.find('[data-testid="close-icon"]').exists()).toBe(true);
    });

    it('should not render header when viewedAgent is falsy', () => {
      const wrapperNull = createWrapper({ viewedAgent: null });
      const wrapperEmpty = createWrapper({ viewedAgent: '' });
      const wrapperUndefined = createWrapper({ viewedAgent: undefined });

      expect(
        wrapperNull.find('[data-testid="view-mode-header"]').exists(),
      ).toBe(false);
      expect(
        wrapperEmpty.find('[data-testid="view-mode-header"]').exists(),
      ).toBe(false);
      expect(
        wrapperUndefined.find('[data-testid="view-mode-header"]').exists(),
      ).toBe(false);
    });

    it('should display correct internationalized title', () => {
      const wrapper = createWrapper({ viewedAgent: 'Jane Smith' });
      const title = wrapper.find('[data-testid="header-title"]');

      expect(title.text()).toContain('dashboard.view-mode.title_Jane Smith');
    });
  });

  describe('Functionality', () => {
    it('should handle closeViewMode method with regular navigation', async () => {
      const wrapper = createWrapper();
      const setActiveRoomSpy = vi.spyOn(wrapper.vm, 'setActiveRoom');

      await wrapper.vm.closeViewMode();

      expect(setActiveRoomSpy).toHaveBeenCalledWith(null);
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith({
        name: 'dashboard.manager',
      });
    });

    it('should handle closeViewMode with insights module postMessage', async () => {
      const postMessageSpy = vi.spyOn(window.parent, 'postMessage');
      const wrapper = createWrapper({}, { oldModule: 'insights' });

      await wrapper.vm.closeViewMode();

      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'redirect', path: 'insights:init' },
        '*',
      );
    });

    it('should handle click and keypress events on close button', async () => {
      const wrapper = createWrapper();
      const closeViewModeSpy = vi.spyOn(wrapper.vm, 'closeViewMode');
      const closeButton = wrapper.find('[data-testid="close-button"]');

      await closeButton.trigger('click');
      expect(closeViewModeSpy).toHaveBeenCalledTimes(1);

      await closeButton.trigger('keypress.enter');
      expect(closeViewModeSpy).toHaveBeenCalledTimes(2);
    });

    it('should integrate with rooms store correctly', () => {
      const wrapper = createWrapper();
      expect(typeof wrapper.vm.setActiveRoom).toBe('function');

      const roomsStore = useRooms();
      expect(roomsStore).toBeDefined();
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const wrapper = createWrapper({ viewedAgent: 'Test User' });
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
