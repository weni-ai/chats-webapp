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
import StatusBar from '@/components/StatusBar.vue';
import i18n from '@/plugins/i18n';

vi.mock('@/store/modules/config', () => ({
  useConfig: () => ({
    project: {
      config: {
        can_see_timer: true,
      },
    },
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
  const mockConsoleLog = vi.fn();
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.log = mockConsoleLog;
    vi.useFakeTimers();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return mount(StatusBar, {
      global: {
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

    it('should render the timer when status is not inactive and can_see_timer is true', async () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="status-bar-timer"]').exists()).toBe(
        false,
      );
      wrapper.vm.selectedStatus = {
        value: 'active',
        label: 'Online',
        color: 'green',
      };

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="status-bar-timer"]').exists()).toBe(
        true,
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

    it('should render all status options in dropdown', async () => {
      wrapper = createWrapper();
      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();
      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      expect(items).toHaveLength(4);
    });
  });

  describe('Status Selection', () => {
    it('should start timer when selecting active status', async () => {
      wrapper = createWrapper();
      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[0].trigger('click');

      expect(wrapper.vm.startDate).not.toBeNull();
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should stop timer when selecting inactive status', async () => {
      wrapper = createWrapper();
      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[0].trigger('click');

      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();
      await items[1].trigger('click');

      expect(wrapper.vm.elapsedTime).toBe(0);
    });
  });

  describe('Timer Functionality', () => {
    it('should format time correctly', () => {
      wrapper = createWrapper();
      wrapper.vm.elapsedTime = { hours: 1, minutes: 30, seconds: 45 };

      expect(wrapper.vm.formattedTime).toBe('01:30:45');
    });

    it('should show 00:00:00 when timer is not started', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.formattedTime).toBe('00:00:00');
    });
  });

  describe('API Interactions', () => {
    it('should call API when changing status to active', async () => {
      wrapper = createWrapper();
      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[0].trigger('click');

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should call API to end current status before starting new one', async () => {
      wrapper = createWrapper();
      wrapper.vm.selectedStatus = {
        value: 'active',
        label: 'Online',
        color: 'green',
      };
      wrapper.vm.isOpen = true;
      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('[data-testid="status-bar-item"]');
      await items[2].trigger('click');

      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should start timer on mount if status is active', async () => {
      wrapper = createWrapper();
      wrapper.vm.selectedStatus = {
        value: 'active',
        label: 'Online',
        color: 'green',
      };
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.startDate).not.toBeNull();
    });
  });

  describe('Visual States', () => {
    it('should show correct icon based on dropdown state', async () => {
      wrapper = createWrapper();

      expect(wrapper.find('[data-testid="header-icon-expand"]').text()).toBe(
        'expand_more',
      );

      await wrapper
        .find('[data-testid="status-bar-selected"]')
        .trigger('click');
      expect(wrapper.find('[data-testid="header-icon-expand"]').text()).toBe(
        'expand_less',
      );
    });

    it('should apply correct status color', () => {
      wrapper = createWrapper();
      const statusIcon = wrapper.find('[data-testid="status-bar-icon"]');

      expect(statusIcon.attributes('style')).toContain(
        'background-color: gray',
      );
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      wrapper = createWrapper();
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
