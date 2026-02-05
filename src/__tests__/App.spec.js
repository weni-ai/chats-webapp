import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import App from '@/App.vue';
import { useConfig } from '@/store/modules/config';
import * as ProfileService from '@/services/api/resources/profile';
import * as ProjectService from '@/services/api/resources/settings/project';
import * as notifications from '@/utils/notifications';
import * as configUtils from '@/utils/config';
import * as storageUtils from '@/utils/storage';

vi.mock('@/services/api/resources/profile', () => ({
  default: {
    me: vi.fn(),
    onboarded: vi.fn(),
    status: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    getInfo: vi.fn(),
  },
}));

vi.mock('@/utils/notifications');
vi.mock('@/utils/config');
vi.mock('@/utils/storage');
vi.mock('@/services/api/websocket/setup', () => ({
  default: vi.fn(),
}));
vi.mock('@/plugins/Hotjar', () => ({
  default: vi.fn(),
}));

describe('App.vue', () => {
  let wrapper;
  let pinia;
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        config: {
          status: 'ONLINE',
          project: {
            uuid: 'project-uuid-123',
            config: {
              has_chats_summary: false,
            },
          },
          token: 'test-token-123',
          socketStatus: 'open',
          disconnectedBy: '',
        },
        profile: {
          me: {
            email: 'test@example.com',
          },
        },
        rooms: {
          activeRoom: null,
        },
        dashboard: {
          viewedAgent: {
            email: '',
            name: '',
          },
        },
        quickMessages: {
          nextQuickMessages: null,
        },
        quickMessagesShared: {
          nextQuickMessagesShared: null,
        },
        featureFlag: {
          featureFlags: {},
        },
      },
    });
    setActivePinia(pinia);

    vi.clearAllMocks();
    vi.mocked(notifications.requestPermission).mockResolvedValue();
    vi.mocked(configUtils.getProject).mockReturnValue('project-uuid-123');
    vi.mocked(storageUtils.moduleStorage.getItem).mockReturnValue(false);
    vi.mocked(storageUtils.moduleStorage.setItem).mockImplementation(() => {});
    vi.mocked(ProfileService.default.me).mockResolvedValue({
      email: 'test@example.com',
    });
    vi.mocked(ProfileService.default.status).mockResolvedValue({
      data: { connection_status: 'ONLINE' },
    });
    vi.mocked(ProfileService.default.updateStatus).mockResolvedValue({
      data: { connection_status: 'ONLINE' },
    });
    vi.mocked(ProjectService.default.getInfo).mockResolvedValue({
      data: {
        uuid: 'project-uuid-123',
        config: { has_chats_summary: false },
      },
    });

    delete window.location;
    window.location = {
      href: 'http://localhost:3000',
    };

    window.parent.postMessage = vi.fn();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  const createWrapper = (options = {}) => {
    const {
      routeName = 'home',
      socketStatus = 'open',
      socketRetryCount = 0,
      wsMock = null,
    } = options;

    const configStore = useConfig();
    configStore.socketStatus = socketStatus;

    const wsInstance = wsMock || {
      reconnectAttempts: socketRetryCount,
      MAX_RECONNECT_ATTEMPTS: 5,
      connect: vi.fn(),
      reconnect: vi.fn(),
    };

    return mount(App, {
      global: {
        plugins: [pinia],
        mocks: {
          $router: mockRouter,
          $route: { name: routeName },
          $i18n: {
            locale: 'en',
          },
        },
        stubs: {
          RouterView: {
            template: '<div data-testid="router-view">RouterView</div>',
          },
          SocketAlertBanner: {
            template:
              '<div data-testid="socket-alert-banner">SocketAlertBanner</div>',
          },
          ModalOfflineAgent: {
            template:
              '<div data-testid="modal-offline-agent">ModalOfflineAgent</div>',
            props: ['modelValue', 'username'],
          },
          ModalRoomSummaryOnboarding: {
            template:
              '<div data-testid="modal-room-summary-onboarding">ModalRoomSummaryOnboarding</div>',
            props: ['modelValue'],
          },
        },
      },
      data() {
        return {
          ws: wsInstance,
        };
      },
    });
  };

  describe('Component Rendering', () => {
    it('should render the App component', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should render RouterView', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="router-view"]').exists()).toBe(true);
    });
  });

  describe('SocketAlertBanner Visibility', () => {
    it('should display SocketAlertBanner when conditions are met', () => {
      const wsMock = {
        reconnectAttempts: 5,
        MAX_RECONNECT_ATTEMPTS: 5,
        connect: vi.fn(),
        reconnect: vi.fn(),
      };

      wrapper = createWrapper({
        routeName: 'home',
        socketStatus: 'closed',
        socketRetryCount: 5,
        wsMock,
      });

      expect(wrapper.find('[data-testid="socket-alert-banner"]').exists()).toBe(
        true,
      );
    });

    it('should display SocketAlertBanner when socketStatus is connecting and retry count is met', () => {
      const wsMock = {
        reconnectAttempts: 5,
        MAX_RECONNECT_ATTEMPTS: 5,
        connect: vi.fn(),
        reconnect: vi.fn(),
      };

      wrapper = createWrapper({
        routeName: 'room',
        socketStatus: 'connecting',
        socketRetryCount: 5,
        wsMock,
      });

      expect(wrapper.find('[data-testid="socket-alert-banner"]').exists()).toBe(
        true,
      );
    });

    it('should not display SocketAlertBanner when socketStatus is open', () => {
      wrapper = createWrapper({
        routeName: 'home',
        socketStatus: 'open',
        socketRetryCount: 0,
      });

      expect(wrapper.find('[data-testid="socket-alert-banner"]').exists()).toBe(
        false,
      );
    });

    it('should not display SocketAlertBanner when retry count is below threshold', () => {
      const wsMock = {
        reconnectAttempts: 3,
        MAX_RECONNECT_ATTEMPTS: 5,
        connect: vi.fn(),
        reconnect: vi.fn(),
      };

      wrapper = createWrapper({
        routeName: 'home',
        socketStatus: 'closed',
        socketRetryCount: 3,
        wsMock,
      });

      expect(wrapper.find('[data-testid="socket-alert-banner"]').exists()).toBe(
        false,
      );
    });

    it('should not display SocketAlertBanner when route is not in allowed routes', () => {
      const wsMock = {
        reconnectAttempts: 5,
        MAX_RECONNECT_ATTEMPTS: 5,
        connect: vi.fn(),
        reconnect: vi.fn(),
      };

      wrapper = createWrapper({
        routeName: 'settings',
        socketStatus: 'closed',
        socketRetryCount: 5,
        wsMock,
      });

      expect(wrapper.find('[data-testid="socket-alert-banner"]').exists()).toBe(
        false,
      );
    });

    it('should display SocketAlertBanner on room route when conditions are met', () => {
      const wsMock = {
        reconnectAttempts: 5,
        MAX_RECONNECT_ATTEMPTS: 5,
        connect: vi.fn(),
        reconnect: vi.fn(),
      };

      wrapper = createWrapper({
        routeName: 'room',
        socketStatus: 'closed',
        socketRetryCount: 5,
        wsMock,
      });

      expect(wrapper.find('[data-testid="socket-alert-banner"]').exists()).toBe(
        true,
      );
    });

    it('should display SocketAlertBanner on discussion route when conditions are met', () => {
      const wsMock = {
        reconnectAttempts: 5,
        MAX_RECONNECT_ATTEMPTS: 5,
        connect: vi.fn(),
        reconnect: vi.fn(),
      };

      wrapper = createWrapper({
        routeName: 'discussion',
        socketStatus: 'closed',
        socketRetryCount: 5,
        wsMock,
      });

      expect(wrapper.find('[data-testid="socket-alert-banner"]').exists()).toBe(
        true,
      );
    });
  });

  describe('ModalOfflineAgent', () => {
    it('should not display ModalOfflineAgent by default', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="modal-offline-agent"]').exists()).toBe(
        false,
      );
    });

    it('should display ModalOfflineAgent when showModalOfflineAgent is true', async () => {
      wrapper = createWrapper();
      await wrapper.setData({ showModalOfflineAgent: true });
      expect(wrapper.find('[data-testid="modal-offline-agent"]').exists()).toBe(
        true,
      );
    });
  });

  describe('ModalRoomSummaryOnboarding', () => {
    it('should not display ModalRoomSummaryOnboarding when enableRoomSummary is false', () => {
      wrapper = createWrapper();
      const configStore = useConfig();
      configStore.project.config.has_chats_summary = false;

      expect(
        wrapper.find('[data-testid="modal-room-summary-onboarding"]').exists(),
      ).toBe(false);
    });

    it('should display ModalRoomSummaryOnboarding when enableRoomSummary is true and showModalRoomSummaryOnboarding is true', async () => {
      const configStore = useConfig();
      configStore.project.config.has_chats_summary = true;

      vi.mocked(storageUtils.moduleStorage.getItem).mockReturnValue(true);

      wrapper = createWrapper();
      await wrapper.setData({ showModalRoomSummaryOnboarding: true });

      expect(
        wrapper.find('[data-testid="modal-room-summary-onboarding"]').exists(),
      ).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should compute socketRetryCount from ws instance', () => {
      const wsMock = {
        reconnectAttempts: 3,
        MAX_RECONNECT_ATTEMPTS: 5,
        connect: vi.fn(),
        reconnect: vi.fn(),
      };

      wrapper = createWrapper({ wsMock });
      expect(wrapper.vm.socketRetryCount).toBe(3);
    });

    it('should return 0 when ws is null', () => {
      wrapper = createWrapper({ wsMock: null });
      wrapper.setData({ ws: null });
      expect(wrapper.vm.socketRetryCount).toBe(0);
    });

    it('should compute userWhoChangedStatus from disconnectedBy', () => {
      const configStore = useConfig();
      configStore.disconnectedBy = 'test-user';

      wrapper = createWrapper();
      expect(wrapper.vm.userWhoChangedStatus).toBe('test-user');
    });
  });
});
