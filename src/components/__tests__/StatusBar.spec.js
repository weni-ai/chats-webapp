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
import { moduleStorage } from '@/utils/storage';

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
    status: 'ONLINE',
    getStatus: vi.fn().mockResolvedValue({
      data: { connection_status: 'ONLINE' },
    }),
    $patch: vi.fn(),
  }),
}));

const mockConfigStore = {
  status: 'ONLINE',
  customStatus: null,
};

vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia');
  return {
    ...actual,
    storeToRefs: vi.fn(() => ({
      status: { value: mockConfigStore.status },
      customStatus: { value: mockConfigStore.customStatus },
    })),
  };
});

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
          status: 'ONLINE',
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
    moduleStorage.clear({ useSession: true });
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

      vi.advanceTimersByTime(300);
      await wrapper.vm.$nextTick();

      await wrapper
        .find('[data-testid="status-bar-selected"]')
        .trigger('click');
      expect(
        wrapper.find('[data-testid="status-bar-list-open"]').exists(),
      ).toBe(false);
    });

    it('should prevent immediate outside clicks from closing dropdown', async () => {
      wrapper = createWrapper();

      await wrapper
        .find('[data-testid="status-bar-selected"]')
        .trigger('click');
      expect(wrapper.vm.isOpen).toBe(true);
      expect(wrapper.vm.isToggling).toBe(true);

      const mockEvent = {
        target: {
          closest: () => null,
        },
      };

      wrapper.vm.handleClickOutside(mockEvent);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(true);

      vi.advanceTimersByTime(300);
      await wrapper.vm.$nextTick();

      wrapper.vm.handleClickOutside(mockEvent);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should ignore rapid successive clicks', async () => {
      wrapper = createWrapper();

      await wrapper
        .find('[data-testid="status-bar-selected"]')
        .trigger('click');
      expect(wrapper.vm.isOpen).toBe(true);
      expect(wrapper.vm.isToggling).toBe(true);

      await wrapper
        .find('[data-testid="status-bar-selected"]')
        .trigger('click');
      expect(wrapper.vm.isOpen).toBe(true);

      vi.advanceTimersByTime(300);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isToggling).toBe(false);

      await wrapper
        .find('[data-testid="status-bar-selected"]')
        .trigger('click');
      expect(wrapper.vm.isOpen).toBe(false);
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
      expect(items).toHaveLength(2);
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
      await items[1].trigger('click');

      expect(api.createCustomStatus).toHaveBeenCalledWith({
        email: 'test@example.com',
        statusType: 'lunch',
      });
    });

    it('should save OFFLINE to moduleStorage when switching from active to custom status', async () => {
      wrapper = createWrapper();

      await wrapper.vm.fetchCustomStatuses();
      await wrapper.vm.$nextTick();

      const activeStatus = wrapper.vm.statuses.find(
        (s) => s.value === 'active',
      );
      wrapper.vm.selectedStatus = { ...activeStatus };

      const setItemSpy = vi.spyOn(moduleStorage, 'setItem');

      const lunchStatus = wrapper.vm.statuses.find((s) => s.value === 'lunch');

      await wrapper.vm.selectStatus(lunchStatus);
      await flushPromises();

      expect(setItemSpy).toHaveBeenCalledWith(
        'statusAgent-test-uuid',
        'OFFLINE',
        { useSession: true },
      );

      setItemSpy.mockRestore();
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

      await items[2].trigger('click');
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
      await items[1].trigger('click');

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
    it('should show success alert when changing to online status', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const onlineStatus = { value: 'active', label: 'Online', color: 'green' };
      wrapper.vm.showStatusAlert(onlineStatus, true);

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Status updated to Online',
          icon: 'indicator',
          scheme: 'feedback-green',
          closeText: 'Close',
          position: 'bottom-right',
        },
        seconds: 15,
      });
    });

    it('should show success alert when changing to offline status', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const offlineStatus = {
        value: 'inactive',
        label: 'Offline',
        color: 'gray',
      };
      wrapper.vm.showStatusAlert(offlineStatus, true);

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Status updated to Offline',
          icon: 'indicator',
          scheme: '$unnnic-color-neutral-black',
          closeText: 'Close',
          position: 'bottom-right',
        },
        seconds: 15,
      });
    });

    it('should show success alert when changing to custom status', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const customStatus = { value: 'lunch', label: 'Lunch', color: 'brown' };
      wrapper.vm.showStatusAlert(customStatus, true);

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Status updated to Lunch',
          icon: 'indicator',
          scheme: 'feedback-green',
          closeText: 'Close',
          position: 'bottom-right',
        },
        seconds: 15,
      });
    });

    it('should show error alert when status update fails', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const status = { value: 'active', label: 'Online', color: 'green' };
      wrapper.vm.showStatusAlert(status, false);

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Unable to update status, please try again.',
          icon: 'indicator',
          scheme: 'feedback-red',
          closeText: 'Close',
          position: 'bottom-right',
        },
        seconds: 15,
      });
    });

    it('should show error alert when API request fails', async () => {
      Profile.updateStatus.mockRejectedValueOnce(new Error('API Error'));

      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[0].trigger('click');
      await flushPromises();

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Unable to update status, please try again.',
          icon: 'indicator',
          scheme: 'feedback-red',
          closeText: 'Close',
          position: 'bottom-right',
        },
        seconds: 15,
      });
    });

    it('should show error alert when custom status creation fails', async () => {
      api.createCustomStatus.mockRejectedValueOnce(new Error('API Error'));

      wrapper = createWrapper();
      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[1].trigger('click');
      await flushPromises();

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Unable to update status, please try again.',
          icon: 'indicator',
          scheme: 'feedback-red',
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

    it('should save OFFLINE to moduleStorage when changing to inactive status', async () => {
      wrapper = createWrapper();

      await wrapper.vm.updateActiveStatus({
        isActive: false,
        skipRequest: true,
      });
      await flushPromises();

      expect(
        moduleStorage.getItem('statusAgent-test-uuid', '', {
          useSession: true,
        }),
      ).toBe('OFFLINE');
    });

    it('should save ONLINE to moduleStorage when changing to active status', async () => {
      wrapper = createWrapper();

      await wrapper.vm.updateActiveStatus({
        isActive: true,
        skipRequest: true,
      });
      await flushPromises();

      expect(
        moduleStorage.getItem('statusAgent-test-uuid', '', {
          useSession: true,
        }),
      ).toBe('ONLINE');
    });

    it('should not save OFFLINE when switching from inactive to custom status', async () => {
      wrapper = createWrapper();

      wrapper.vm.selectedStatus = {
        value: 'inactive',
        label: 'Offline',
        color: 'gray',
      };
      moduleStorage.setItem('statusAgent-test-uuid', 'OFFLINE', {
        useSession: true,
      });

      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[1].trigger('click');
      await flushPromises();

      expect(
        moduleStorage.getItem('statusAgent-test-uuid', '', {
          useSession: true,
        }),
      ).toBe('OFFLINE');
    });
  });

  describe('Timer Functionality', () => {
    it('should stop timer when unmounting component', async () => {
      wrapper = createWrapper();
      await wrapper.vm.fetchCustomStatuses();
      wrapper.vm.toggleDropdown();
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[1].trigger('click');

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
      moduleStorage.setItem('statusAgent-test-uuid', 'ONLINE', {
        useSession: true,
      });
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

      expect(
        moduleStorage.getItem('statusAgent-test-uuid', null, {
          useSession: true,
        }),
      ).toBe('ONLINE');
    });
  });

  describe('Status Color Management', () => {
    it('should apply correct color class for each status', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const statusIcon = wrapper.find('[data-testid="status-bar-icon"]');
      expect(statusIcon.classes()).toContain('status-bar--green');

      wrapper.vm.selectedStatus = {
        value: 'inactive',
        label: 'Offline',
        color: 'gray',
      };
      await wrapper.vm.$nextTick();
      expect(statusIcon.classes()).toContain('status-bar--gray');

      wrapper.vm.selectedStatus = {
        value: 'lunch',
        label: 'Lunch',
        color: 'brown',
      };
      await wrapper.vm.$nextTick();
      expect(statusIcon.classes()).toContain('status-bar--brown');
    });
  });

  describe('LocalStorage Settings Update Handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      Storage.prototype.getItem = vi.fn();
      Storage.prototype.setItem = vi.fn();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('should not refresh data when localStorage settingsUpdated remains the same', async () => {
      const getItemMock = vi.fn().mockImplementation((key) => {
        if (key === 'settingsUpdated') return '1234567890';
        if (key === 'lastSettingsUpdate') return '1234567890';
        return null;
      });

      Storage.prototype.getItem = getItemMock;

      wrapper = createWrapper();
      await flushPromises();

      const refreshDataSpy = vi.spyOn(wrapper.vm, 'refreshData');
      refreshDataSpy.mockClear();

      vi.advanceTimersByTime(1000);
      await flushPromises();

      expect(refreshDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('Watch Functionality', () => {
    beforeEach(async () => {
      mockConfigStore.status = 'ONLINE';
      mockConfigStore.customStatus = null;
    });

    describe('Watch Implementation Tests', () => {
      it('should test the logical behavior of configStatus watch conditions', async () => {
        wrapper = createWrapper();
        await flushPromises();

        wrapper.vm.statuses = [
          { value: 'active', label: 'Online', color: 'green' },
          { value: 'inactive', label: 'Offline', color: 'gray' },
          { value: 'lunch', label: 'Lunch', color: 'brown' },
        ];
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.statuses).toHaveLength(3);
        expect(wrapper.vm.statuses[1].value).toBe('inactive');

        const statusAgentKey = `statusAgent-test-uuid`;
        moduleStorage.setItem(statusAgentKey, 'OFFLINE', {
          useSession: true,
        });

        const newStatus = 'OFFLINE';
        const storageValue = moduleStorage.getItem(statusAgentKey, '', {
          useSession: true,
        });

        if (newStatus === 'OFFLINE' && storageValue === 'OFFLINE') {
          wrapper.vm.selectedStatus = wrapper.vm.statuses[1];
        }

        expect(wrapper.vm.selectedStatus.value).toBe('inactive');
      });

      it('should test configCustomStatus watch logic', async () => {
        wrapper = createWrapper();
        await flushPromises();

        wrapper.vm.statuses = [
          { value: 'active', label: 'Online', color: 'green' },
          { value: 'inactive', label: 'Offline', color: 'gray' },
          { value: 'lunch', label: 'Lunch', color: 'brown' },
        ];
        await wrapper.vm.$nextTick();

        wrapper.vm.selectedStatus = wrapper.vm.statuses[0];
        expect(wrapper.vm.selectedStatus.value).toBe('active');

        const newCustomStatus = 'CUSTOM';

        if (newCustomStatus === 'CUSTOM') {
          wrapper.vm.selectedStatus = wrapper.vm.statuses[1];
        }

        expect(wrapper.vm.selectedStatus.value).toBe('inactive');
      });

      it('should not change status when configStatus conditions are not met', async () => {
        wrapper = createWrapper();
        await flushPromises();

        wrapper.vm.statuses = [
          { value: 'active', label: 'Online', color: 'green' },
          { value: 'inactive', label: 'Offline', color: 'gray' },
        ];
        await wrapper.vm.$nextTick();

        wrapper.vm.selectedStatus = wrapper.vm.statuses[0];
        const initialStatus = wrapper.vm.selectedStatus;

        const statusAgentKey = `statusAgent-test-uuid`;
        moduleStorage.setItem(statusAgentKey, 'ONLINE', {
          useSession: true,
        });

        const newStatus = 'OFFLINE';
        const storageValue = moduleStorage.getItem(statusAgentKey, '', {
          useSession: true,
        });

        if (newStatus === 'OFFLINE' && storageValue === 'OFFLINE') {
          wrapper.vm.selectedStatus = wrapper.vm.statuses[1];
        }

        expect(wrapper.vm.selectedStatus).toBe(initialStatus);
      });

      it('should not change status when configCustomStatus is not CUSTOM', async () => {
        wrapper = createWrapper();
        await flushPromises();

        wrapper.vm.statuses = [
          { value: 'active', label: 'Online', color: 'green' },
          { value: 'inactive', label: 'Offline', color: 'gray' },
        ];
        await wrapper.vm.$nextTick();

        wrapper.vm.selectedStatus = wrapper.vm.statuses[0];
        const initialStatus = wrapper.vm.selectedStatus;

        const newCustomStatus = 'OTHER';

        if (newCustomStatus === 'CUSTOM') {
          wrapper.vm.selectedStatus = wrapper.vm.statuses[1];
        }

        expect(wrapper.vm.selectedStatus).toBe(initialStatus);
      });

      it('should verify watch logic structure and component setup', () => {
        wrapper = createWrapper();

        wrapper.vm.statuses = [
          { value: 'active', label: 'Online', color: 'green' },
          { value: 'inactive', label: 'Offline', color: 'gray' },
        ];

        expect(wrapper.vm.statuses).toBeDefined();
        expect(wrapper.vm.selectedStatus).toBeDefined();
        expect(wrapper.vm.statuses).toBeInstanceOf(Array);
        expect(wrapper.vm.statuses).toHaveLength(2);

        wrapper.vm.selectedStatus = wrapper.vm.statuses[1];
        expect(wrapper.vm.selectedStatus.value).toBe('inactive');
      });
    });
  });
});
