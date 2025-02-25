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
import { mount, config, flushPromises } from '@vue/test-utils';
import StatusBar from '@/components/StatusBar.vue';
import i18n from '@/plugins/i18n';
import api from '@/services/api/resources/chats/pauseStatus';
import { createTestingPinia } from '@pinia/testing';
import Profile from '@/services/api/resources/profile';
import { setActivePinia } from 'pinia';
import unnnic from '@weni/unnnic-system';

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

vi.mock('@/store/modules/config', () => ({
  useConfig: () => ({
    project: {
      uuid: 'test-uuid',
      config: {
        can_see_timer: true,
      },
    },
    getStatus: vi.fn().mockResolvedValue({
      data: { connection_status: 'ONLINE' },
    }),
    $patch: vi.fn(),
  }),
}));

vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn(() => '2024-02-14T10:00:00+00:00'),
    intervalToDuration: vi.fn(() => ({ hours: 1, minutes: 30, seconds: 45 })),
    parseISO: vi.fn(),
  };
});

vi.mock('@/services/api/resources/chats/pauseStatus', () => ({
  default: {
    getCustomStatusTypeList: vi.fn().mockResolvedValue([
      { value: 'active', label: 'Online', color: 'green' },
      { value: 'inactive', label: 'Offline', color: 'gray' },
      { value: 'lunch', label: 'Lunch', color: 'brown' },
    ]),
    getActiveCustomStatus: vi.fn().mockResolvedValue({
      uuid: 'status-123',
      status_type: 'lunch',
      is_active: true,
      created_on: '2024-02-14T10:00:00+00:00',
    }),
    closeCustomStatus: vi.fn().mockResolvedValue({}),
    createCustomStatus: vi.fn().mockResolvedValue({
      uuid: 'new-status-123',
      status_type: 'lunch',
    }),
  },
}));

vi.mock('@/services/api/resources/profile', () => ({
  default: {
    updateStatus: vi.fn().mockResolvedValue({
      data: { connection_status: 'ONLINE' },
    }),
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

describe('StatusBar', () => {
  let wrapper;
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        config: {
          project: {
            uuid: 'test-uuid',
            config: {
              can_see_timer: true,
            },
          },
          getStatus: vi.fn().mockResolvedValue({
            data: { connection_status: 'ONLINE' },
          }),
        },
        profile: {
          me: {
            email: 'test@example.com',
          },
        },
      },
    });
    setActivePinia(pinia);
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const createWrapper = () => {
    return mount(StatusBar, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          UnnnicIcon: {
            template:
              '<div class="unnnic-icon" data-testid="unnnic-icon"><slot /></div>',
            props: ['icon', 'scheme'],
          },
        },
      },
    });
  };

  describe('Initial Rendering', () => {
    it('should render the status bar component', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="status-bar"]').exists()).toBe(true);
    });

    it('should initialize with Offline status', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="selected-status-label"]').text()).toBe(
        'Offline',
      );
    });
  });

  describe('Dropdown Functionality', () => {
    it('should toggle dropdown when clicking on status bar', async () => {
      wrapper = createWrapper();
      expect(
        wrapper.find('[data-testid="status-bar-list-open"]').exists(),
      ).toBe(false);

      await wrapper
        .find('[data-testid="status-bar-selected"]')
        .trigger('click');
      expect(
        wrapper.find('[data-testid="status-bar-list-open"]').exists(),
      ).toBe(true);

      await wrapper
        .find('[data-testid="status-bar-selected"]')
        .trigger('click');
      expect(
        wrapper.find('[data-testid="status-bar-list-open"]').exists(),
      ).toBe(false);
    });
  });

  describe('Custom Status Management', () => {
    beforeEach(() => {
      api.getCustomStatusTypeList.mockResolvedValue([
        { value: 'active', label: 'Online', color: 'green' },
        { value: 'inactive', label: 'Offline', color: 'gray' },
        { value: 'lunch', label: 'Lunch', color: 'brown' },
      ]);

      api.getActiveCustomStatus.mockResolvedValue({
        uuid: '123',
        status_type: 'lunch',
        is_active: true,
        created_on: '2024-02-14T10:00:00+00:00',
      });
    });

    it('should fetch and set custom statuses on mount', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      expect(items).toHaveLength(3);
      expect(wrapper.vm.statuses).toEqual([
        { value: 'active', label: 'Online', color: 'green', statusUuid: null },
        {
          value: 'inactive',
          label: 'Offline',
          color: 'gray',
          statusUuid: null,
        },
        { value: 'lunch', label: 'Lunch', color: 'brown', statusUuid: '123' },
      ]);
      expect(api.getCustomStatusTypeList).toHaveBeenCalled();
    });

    it('should handle switching from active to custom status', async () => {
      wrapper = createWrapper();

      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[2].trigger('click');

      expect(api.createCustomStatus).toHaveBeenCalledWith({
        email: 'test@example.com',
        statusType: 'lunch',
      });
    });

    it('should handle switching between custom statuses', async () => {
      api.getCustomStatusTypeList.mockResolvedValue([
        { value: 'active', label: 'Online', color: 'green' },
        { value: 'inactive', label: 'Offline', color: 'gray' },
        { value: 'lunch', label: 'Lunch', color: 'brown' },
        { value: 'other', label: 'other', color: 'brown' },
      ]);

      api.getActiveCustomStatus.mockResolvedValue({
        uuid: 'status-123',
        status_type: 'lunch',
        is_active: true,
        created_on: '2024-02-14T10:00:00+00:00',
      });

      api.closeCustomStatus.mockClear();
      api.createCustomStatus.mockClear();

      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.selectedStatus = {
        value: 'lunch',
        label: 'Lunch',
        color: 'brown',
        statusUuid: 'status-123',
      };

      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');

      await items[3].trigger('click');
      await flushPromises();

      expect(api.closeCustomStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          statusUuid: 'status-123',
          isActive: false,
        }),
      );

      expect(api.createCustomStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.any(String),
          statusType: expect.any(String),
        }),
      );
    });

    it('should close custom status when switching to active/inactive', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      wrapper.vm.selectedStatus = {
        value: 'lunch',
        label: 'Lunch',
        color: 'brown',
        statusUuid: 'status-123',
      };
      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[0].trigger('click');

      expect(api.closeCustomStatus).toHaveBeenCalled();
    });
  });

  describe('Timer Management', () => {
    it('should start timer for custom status', async () => {
      wrapper = createWrapper();

      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[2].trigger('click');

      expect(wrapper.vm.startDate).not.toBeNull();
      expect(wrapper.find('[data-testid="status-bar-timer"]').exists()).toBe(
        true,
      );
    });

    it('should not show timer for active/inactive status', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      wrapper.vm.selectedStatus = {
        value: 'active',
        label: 'Online',
        color: 'green',
      };
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="status-bar-timer"]').exists()).toBe(
        false,
      );
    });

    it('should format time correctly', () => {
      wrapper = createWrapper();
      wrapper.vm.elapsedTime = { hours: 1, minutes: 30, seconds: 45 };

      expect(wrapper.vm.formattedTime).toBe('01:30:45');
    });
  });

  describe('Status Alerts', () => {
    it('should show status alert when changing status', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[0].trigger('click');

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'You are online',
          icon: 'indicator',
          scheme: 'feedback-green',
          closeText: 'Close',
          position: 'bottom-right',
        },
        seconds: 15,
      });
    });
  });

  describe('API Interactions', () => {
    it('should call updateStatus API when changing to active/inactive', async () => {
      wrapper = createWrapper();
      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[0].trigger('click');

      expect(Profile.updateStatus).toHaveBeenCalledWith({
        projectUuid: 'test-uuid',
        status: 'ONLINE',
      });
    });
  });

  describe('Timer Functionality', () => {
    it('should stop timer when unmounting component', async () => {
      wrapper = createWrapper();
      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[2].trigger('click');

      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      wrapper.unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should update elapsed time every second', async () => {
      wrapper = createWrapper();
      wrapper.vm.selectedStatus = {
        value: 'lunch',
        label: 'Lunch',
        color: 'brown',
      };
      wrapper.vm.startDate = new Date().toISOString();
      await wrapper.vm.$nextTick();

      vi.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.elapsedTime).toBeDefined();
    });
  });

  describe('Session Storage Management', () => {
    it('should initialize status from session storage', async () => {
      sessionStorage.setItem('statusAgent', 'ONLINE');
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedStatus.value).toBe('active');
    });

    it('should update session storage when changing status', async () => {
      wrapper = createWrapper();
      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[0].trigger('click');

      expect(sessionStorage.getItem('statusAgent')).toBe('ONLINE');
    });
  });

  describe('Status Color Management', () => {
    it('should apply correct color class for each status', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const statusIcon = wrapper.find('[data-testid="status-bar-icon"]');
      expect(statusIcon.classes()).toContain('status-bar--gray');

      wrapper.vm.selectedStatus = {
        value: 'active',
        label: 'Online',
        color: 'green',
      };
      await wrapper.vm.$nextTick();
      expect(statusIcon.classes()).toContain('status-bar--green');

      wrapper.vm.selectedStatus = {
        value: 'lunch',
        label: 'Lunch',
        color: 'brown',
      };
      await wrapper.vm.$nextTick();
      expect(statusIcon.classes()).toContain('status-bar--brown');
    });
  });
});
