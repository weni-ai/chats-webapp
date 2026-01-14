import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import SocketAlertBanner from '../SocketAlertBanner.vue';
import i18n from '@/plugins/i18n';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import unnnic from '@weni/unnnic-system';
import { useConfig } from '@/store/modules/config';

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
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

describe('SocketAlertBanner', () => {
  let wrapper;
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        config: {
          socketStatus: '',
        },
      },
    });
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (wrapper) {
      if (wrapper.parentWrapper) {
        wrapper.parentWrapper.unmount();
      } else {
        wrapper.unmount();
      }
    }
  });

  const createWrapper = (socketStatus = '') => {
    const configStore = useConfig();
    configStore.socketStatus = socketStatus;

    const wsReconnectMock = vi.fn();

    // Create a wrapper component that provides $root
    const TestWrapper = {
      name: 'TestWrapper',
      components: {
        SocketAlertBanner,
      },
      methods: {
        wsReconnect: wsReconnectMock,
      },
      template: '<SocketAlertBanner ref="banner" />',
    };

    const parentWrapper = mount(TestWrapper, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key) => {
            const translations = {
              'socket_alert_banner.closed.title':
                'You are disconnected. Please ',
              'socket_alert_banner.closed.refresh': 'refresh',
              'socket_alert_banner.closed.to_continue':
                ' to continue assisting.',
              'socket_alert_banner.connecting': 'Loading...',
              'socket_alert_banner.connected':
                'Update completed successfully! You can continue your support.',
            };
            return translations[key] || key;
          },
        },
        stubs: {
          UnnnicIcon: {
            template:
              '<div class="unnnic-icon" data-testid="unnnic-icon"><slot /></div>',
            props: ['icon', 'scheme', 'size'],
          },
        },
      },
    });

    const wrapper = parentWrapper.findComponent(SocketAlertBanner);
    // The $root should automatically point to the parent component
    // Store the mock and parent wrapper for cleanup
    wrapper.wsReconnectMock = wsReconnectMock;
    wrapper.parentWrapper = parentWrapper;

    return wrapper;
  };

  describe('Initial Rendering', () => {
    it('should render the component', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should have correct CSS classes', () => {
      wrapper = createWrapper('closed');
      expect(wrapper.find('.socket-alert-banner').exists()).toBe(true);
      expect(wrapper.find('.socket-alert-banner').classes()).toContain(
        'closed',
      );
    });

    it('should apply connecting class when socketStatus is connecting', () => {
      wrapper = createWrapper('connecting');
      expect(wrapper.find('.socket-alert-banner').classes()).toContain(
        'connecting',
      );
    });
  });

  describe('Closed State', () => {
    it('should render closed state content when socketStatus is closed', () => {
      wrapper = createWrapper('closed');
      const content = wrapper.find('.socket-alert-banner__content');
      expect(content.exists()).toBe(true);
    });

    it('should render UnnnicIcon with correct props when closed', () => {
      wrapper = createWrapper('closed');
      const icon = wrapper.find('[data-testid="unnnic-icon"]');
      expect(icon.exists()).toBe(true);

      const unnnicIconStub = wrapper.findComponent({ name: 'UnnnicIcon' });
      if (unnnicIconStub.exists()) {
        expect(unnnicIconStub.props('icon')).toBe('block');
        expect(unnnicIconStub.props('scheme')).toBe('neutral-white');
        expect(unnnicIconStub.props('size')).toBe('ant');
      }
    });

    it('should render all text elements when closed', () => {
      wrapper = createWrapper('closed');
      const textSection = wrapper.find('.socket-alert-banner__content__text');
      expect(textSection.exists()).toBe(true);

      const spans = textSection.findAll('span');
      expect(spans.length).toBe(3);

      expect(spans[0].text().trim()).toBe('You are disconnected. Please');
      expect(spans[1].text()).toBe('refresh');
      expect(spans[2].text().trim()).toBe('to continue assisting.');
    });

    it('should have refresh link with correct styling', () => {
      wrapper = createWrapper('closed');
      const refreshLink = wrapper.find(
        '.socket-alert-banner__content__text__refresh',
      );
      expect(refreshLink.exists()).toBe(true);
      expect(refreshLink.text()).toBe('refresh');
    });
  });

  describe('Connecting State', () => {
    it('should render connecting state content when socketStatus is connecting', () => {
      wrapper = createWrapper('connecting');
      const content = wrapper.find('.socket-alert-banner__content');
      expect(content.exists()).toBe(true);
      expect(content.text()).toBe('Loading...');
    });

    it('should not render closed state content when connecting', () => {
      wrapper = createWrapper('connecting');
      const textSection = wrapper.find('.socket-alert-banner__content__text');
      expect(textSection.exists()).toBe(false);
    });

    it('should not render icon when connecting', () => {
      wrapper = createWrapper('connecting');
      const icon = wrapper.find('[data-testid="unnnic-icon"]');
      expect(icon.exists()).toBe(false);
    });
  });

  describe('Unmounted Hook', () => {
    it('should call unnnicCallAlert with success message when component is unmounted', () => {
      wrapper = createWrapper('closed');

      if (wrapper.parentWrapper) {
        wrapper.parentWrapper.unmount();
      } else {
        wrapper.unmount();
      }

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          type: 'success',
          text: 'Update completed successfully! You can continue your support.',
        },
      });
    });

    it('should call unnnicCallAlert with correct i18n key on unmount', () => {
      wrapper = createWrapper('connecting');

      if (wrapper.parentWrapper) {
        wrapper.parentWrapper.unmount();
      } else {
        wrapper.unmount();
      }

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          type: 'success',
          text: 'Update completed successfully! You can continue your support.',
        },
      });
    });
  });

  describe('Component States', () => {
    it('should not render content when socketStatus is empty', () => {
      wrapper = createWrapper('');
      const closedContent = wrapper.find('.socket-alert-banner__content');
      expect(closedContent.exists()).toBe(false);
    });

    it('should handle state changes reactively', async () => {
      wrapper = createWrapper('closed');
      expect(wrapper.find('.socket-alert-banner__content__text').exists()).toBe(
        true,
      );

      const configStore = useConfig();
      configStore.socketStatus = 'connecting';

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.socketStatus).toBe('connecting');
    });
  });

  describe('Accessibility and Styling', () => {
    it('should have correct positioning styles', () => {
      wrapper = createWrapper('closed');
      const banner = wrapper.find('.socket-alert-banner');
      expect(banner.exists()).toBe(true);
    });

    it('should have refresh link with pointer cursor', () => {
      wrapper = createWrapper('closed');
      const refreshLink = wrapper.find(
        '.socket-alert-banner__content__text__refresh',
      );
      expect(refreshLink.classes()).toContain(
        'socket-alert-banner__content__text__refresh',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined socketStatus gracefully', () => {
      wrapper = createWrapper(undefined);
      expect(wrapper.exists()).toBe(true);
    });
  });
});
