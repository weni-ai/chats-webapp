import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import LiveMetrics from '../LiveMetrics.vue';
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';

vi.mock('@/services/api/resources/dashboard/dashboardManager', () => ({
  default: {
    getAgentInfo: vi.fn(),
    getRoomInfo: vi.fn(),
    getSectorInfo: vi.fn(),
    getRawInfo: vi.fn(),
  },
}));

const mockApiData = {
  agents: { project_agents: [{ name: 'Agent 1', chats: 5 }] },
  generalMetrics: { total_rooms: 10, active_rooms: 5 },
  sectors: [{ name: 'Sector 1', count: 3 }],
  rawInfo: { total_data: 100 },
};

const defaultProps = {
  headerTitle: 'Test Header',
  generalCardLabel: 'Test Label',
};

const createWrapper = (props = {}) => {
  return mount(LiveMetrics, {
    props: { ...defaultProps, ...props },
    global: {
      mocks: {
        $t: (key) => {
          const translations = {
            agent: 'Agent',
            active_chats: 'Active chats',
            agents_online: 'Agents online',
          };
          return translations[key] || key;
        },
      },
    },
  });
};

describe('LiveMetrics Component', () => {
  let wrapper;
  let consoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    DashboardManagerApi.getAgentInfo.mockResolvedValue(mockApiData.agents);
    DashboardManagerApi.getRoomInfo.mockResolvedValue(
      mockApiData.generalMetrics,
    );
    DashboardManagerApi.getSectorInfo.mockResolvedValue(mockApiData.sectors);
    DashboardManagerApi.getRawInfo.mockResolvedValue(mockApiData.rawInfo);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    wrapper?.unmount();
  });

  describe('Component Structure and Rendering', () => {
    it('should render main dashboard container with correct data-testid', () => {
      wrapper = createWrapper();

      const dashboard = wrapper.find('[data-testid="general-dashboard"]');
      expect(dashboard.exists()).toBe(true);
      expect(dashboard.classes()).toContain('general-dashboard');
    });

    it('should render all three child components with proper data-testids', () => {
      wrapper = createWrapper();

      expect(wrapper.find('[data-testid="general-metrics"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="card-group-metrics"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="table-metrics"]').exists()).toBe(true);
    });

    it('should apply correct grid CSS classes to child components', () => {
      wrapper = createWrapper();

      const generalMetrics = wrapper.find('[data-testid="general-metrics"]');
      const cardGroupMetrics = wrapper.find(
        '[data-testid="card-group-metrics"]',
      );
      const tableMetrics = wrapper.find('[data-testid="table-metrics"]');

      expect(generalMetrics.classes()).toContain('grid-1');
      expect(cardGroupMetrics.classes()).toContain('grid-2');
      expect(tableMetrics.classes()).toContain('grid-3');
    });
  });

  describe('Props and Component Configuration', () => {
    it('should handle headerTitle prop correctly', () => {
      const customTitle = 'Custom Dashboard Title';
      wrapper = createWrapper({ headerTitle: customTitle });

      expect(wrapper.find('[data-testid="general-dashboard"]').exists()).toBe(
        true,
      );
    });

    it('should handle generalCardLabel prop correctly', () => {
      const customLabel = 'Custom Card Label';
      wrapper = createWrapper({ generalCardLabel: customLabel });

      expect(wrapper.find('[data-testid="general-dashboard"]').exists()).toBe(
        true,
      );
    });

    it('should initialize with correct table headers structure', () => {
      wrapper = createWrapper();

      const expectedHeaders = [
        { text: 'Agent', value: 'name' },
        { text: 'Active chats', value: 'chats' },
      ];

      expect(wrapper.vm.tableHeaders).toEqual(expectedHeaders);
    });

    it('should handle empty props gracefully', () => {
      wrapper = createWrapper({ headerTitle: '', generalCardLabel: '' });

      expect(wrapper.find('[data-testid="general-dashboard"]').exists()).toBe(
        true,
      );
    });
  });

  describe('Lifecycle and API Integration', () => {
    it('should call all required API methods on component mount', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(DashboardManagerApi.getAgentInfo).toHaveBeenCalledTimes(1);
      expect(DashboardManagerApi.getRoomInfo).toHaveBeenCalledTimes(1);
      expect(DashboardManagerApi.getSectorInfo).toHaveBeenCalledTimes(1);
      expect(DashboardManagerApi.getRawInfo).toHaveBeenCalledTimes(1);
    });

    it('should update component data with API responses', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.agents).toEqual(mockApiData.agents);
      expect(wrapper.vm.generalMetrics).toEqual(mockApiData.generalMetrics);
      expect(wrapper.vm.sectors).toEqual(mockApiData.sectors);
      expect(wrapper.vm.rawInfo).toEqual(mockApiData.rawInfo);
    });

    it('should maintain component reactivity when data changes', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const newData = { project_agents: [{ name: 'New Agent', chats: 10 }] };
      wrapper.vm.agents = newData;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.agents).toEqual(newData);
    });
  });

  describe('Error Handling', () => {
    const createErrorTest = (apiMethod, methodName) => async () => {
      const testError = new Error(`${methodName} failed`);
      DashboardManagerApi[apiMethod].mockRejectedValue(testError);

      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(consoleSpy).toHaveBeenCalledWith(testError);
      expect(wrapper.find('[data-testid="general-dashboard"]').exists()).toBe(
        true,
      );
    };

    it(
      'should handle getAgentInfo API failures',
      createErrorTest('getAgentInfo', 'AgentInfo'),
    );
    it(
      'should handle getRoomInfo API failures',
      createErrorTest('getRoomInfo', 'RoomInfo'),
    );
    it(
      'should handle getSectorInfo API failures',
      createErrorTest('getSectorInfo', 'SectorInfo'),
    );
    it(
      'should handle getRawInfo API failures',
      createErrorTest('getRawInfo', 'RawInfo'),
    );

    it('should handle multiple simultaneous API failures', async () => {
      const error1 = new Error('AgentInfo failed');
      const error2 = new Error('RoomInfo failed');

      DashboardManagerApi.getAgentInfo.mockRejectedValue(error1);
      DashboardManagerApi.getRoomInfo.mockRejectedValue(error2);

      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(consoleSpy).toHaveBeenCalledWith(error1);
      expect(consoleSpy).toHaveBeenCalledWith(error2);
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      expect(wrapper.find('[data-testid="general-dashboard"]').exists()).toBe(
        true,
      );
    });
  });

  describe('Component Behavior and Business Logic', () => {
    it('should initialize with empty data objects before API calls', () => {
      wrapper = createWrapper();

      expect(wrapper.vm.agents).toEqual({});
      expect(wrapper.vm.generalMetrics).toEqual({});
      expect(wrapper.vm.sectors).toEqual({});
      expect(wrapper.vm.rawInfo).toEqual({});
    });

    it('should handle component destruction gracefully', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(() => wrapper.unmount()).not.toThrow();
    });

    it('should maintain component name for identification', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.$options.name).toBe('GeneralLiveMetrics');
    });
  });
});
