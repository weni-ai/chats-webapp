import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import HistoryMetricsBySector from '../HistoryMetrics.vue';
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';
import env from '@/utils/env';

vi.mock('@/services/api/resources/dashboard/dashboardManager', () => ({
  default: {
    getAgentInfo: vi.fn(),
    getRoomInfo: vi.fn(),
    getSectorInfo: vi.fn(),
    getRawInfo: vi.fn(),
    downloadData: vi.fn(),
  },
}));

vi.mock('@/utils/env', () => ({
  default: vi.fn(),
}));

const mockFilterData = {
  sector: 'sector-uuid',
  agent: 'agent-uuid',
  tags: ['tag1', 'tag2'],
  filterDate: {
    start: '2023-01-01',
    end: '2023-01-31',
  },
};

const mockApiResponses = {
  agents: {
    project_agents: [
      { id: 1, first_name: 'John', agent_status: 'ONLINE', chats: 5 },
      { id: 2, first_name: 'Alice', agent_status: 'OFFLINE', chats: 3 },
    ],
  },
  generalMetrics: { total_rooms: 10, active_rooms: 5 },
  sectorInfo: {
    sectors: [{ uuid: 'sector1', name: 'Support', count: 15 }],
  },
  rawInfo: { raw_data: [{ total_data: 100 }] },
};

const mockSectorsData = [{ uuid: 'sector1', name: 'Support' }];

const mockTranslations = {
  sectors: 'Sectors',
  chats_per_agents: 'Chats per agents',
  agent: 'Agent',
  chats_in_the_period: 'Chats in the period',
};

const mockComponents = {
  GeneralMetrics: {
    template: '<div data-testid="general-metrics-mock">GeneralMetrics</div>',
  },
  CardGroupMetrics: {
    template:
      '<div data-testid="card-group-metrics-mock">CardGroupMetrics</div>',
  },
  TableMetrics: {
    template: '<div data-testid="table-metrics-mock">TableMetrics</div>',
  },
};

const createWrapper = (props = {}) => {
  const defaultProps = {
    filter: mockFilterData,
    headerTitle: 'Test Header',
    agentsLabel: 'Test Agents',
    totalChatsLabel: 'Total Chats',
    generalCardLabel: 'General',
    sectors: mockSectorsData,
  };

  return mount(HistoryMetricsBySector, {
    props: { ...defaultProps, ...props },
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            config: { project: { uuid: 'project-uuid' } },
          },
        }),
      ],
      mocks: {
        $t: (key) => mockTranslations[key] || key,
      },
      stubs: mockComponents,
    },
  });
};

describe('HistoryMetricsBySector Component', () => {
  let wrapper;
  let consoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    DashboardManagerApi.getAgentInfo.mockResolvedValue(mockApiResponses.agents);
    DashboardManagerApi.getRoomInfo.mockResolvedValue(
      mockApiResponses.generalMetrics,
    );
    DashboardManagerApi.getSectorInfo.mockResolvedValue(
      mockApiResponses.sectorInfo,
    );
    DashboardManagerApi.getRawInfo.mockResolvedValue(mockApiResponses.rawInfo);
    DashboardManagerApi.downloadData.mockResolvedValue({});

    wrapper = createWrapper();
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllTimers();
    vi.useRealTimers();
    consoleSpy.mockRestore();
  });

  describe('Component Structure and Rendering', () => {
    it('should render main dashboard container with correct data-testid', () => {
      const dashboard = wrapper.find(
        '[data-testid="history-metrics-dashboard"]',
      );
      expect(dashboard.exists()).toBe(true);
      expect(dashboard.classes()).toContain('history-metrics');
    });

    it('should render all child components with proper data-testids', () => {
      expect(wrapper.html()).toContain('GeneralMetrics');
      expect(wrapper.html()).toContain('CardGroupMetrics');
      expect(wrapper.html()).toContain('TableMetrics');
    });
  });

  describe('Props and Data Initialization', () => {
    it('should accept and handle all props correctly', () => {
      expect(wrapper.props('filter')).toEqual(mockFilterData);
      expect(wrapper.props('headerTitle')).toBe('Test Header');
      expect(wrapper.props('sectors')).toEqual(mockSectorsData);
    });

    it('should use default empty array for sectors prop', () => {
      const noSectorsWrapper = mount(HistoryMetricsBySector, {
        global: {
          plugins: [
            createTestingPinia({
              initialState: {
                config: { project: { uuid: 'project-uuid' } },
              },
            }),
          ],
          mocks: {
            $t: (key) => mockTranslations[key] || key,
          },
          stubs: mockComponents,
        },
      });

      expect(noSectorsWrapper.vm.sectors).toEqual([]);
      noSectorsWrapper.unmount();
    });

    it('should initialize with correct table headers structure', () => {
      const expectedHeaders = [
        { text: 'Agent', value: 'name' },
        { text: 'Chats in the period', value: 'chats' },
      ];

      expect(wrapper.vm.tableHeaders).toEqual(expectedHeaders);
    });
  });

  describe('Lifecycle and API Integration', () => {
    it('should call API methods on component mount', async () => {
      await wrapper.vm.$nextTick();

      expect(DashboardManagerApi.getRoomInfo).toHaveBeenCalled();
      expect(DashboardManagerApi.getAgentInfo).toHaveBeenCalled();
    });

    it('should handle filter changes and trigger timer when env enabled', async () => {
      env.mockReturnValue('project-uuid, other-project');

      const timerWrapper = createWrapper({
        filter: {},
      });

      const startTimerSpy = vi.spyOn(timerWrapper.vm, 'startMetricsTimer');

      await timerWrapper.setProps({
        filter: mockFilterData,
      });
      await timerWrapper.vm.$nextTick();

      expect(startTimerSpy).toHaveBeenCalled();

      timerWrapper.unmount();
    });

    it('should handle filter changes without timer when env disabled - Coverage Lines 114-124', async () => {
      env.mockReturnValue('other-project, another-project');

      const timerWrapper = createWrapper({
        filter: {},
      });

      const startTimerSpy = vi.spyOn(timerWrapper.vm, 'startMetricsTimer');

      await timerWrapper.setProps({
        filter: mockFilterData,
      });
      await timerWrapper.vm.$nextTick();

      expect(startTimerSpy).not.toHaveBeenCalled();

      timerWrapper.unmount();
    });
  });

  describe('Agent Ordering and Processing', () => {
    it('should order agents with online first, then offline', () => {
      const agents = [
        { first_name: 'Charlie', agent_status: 'OFFLINE' },
        { first_name: 'Alice', agent_status: 'ONLINE' },
      ];

      const ordered = wrapper.vm.orderAgents(agents);

      expect(ordered[0]).toMatchObject({
        first_name: 'Alice',
        agent_status: 'ONLINE',
      });
      expect(ordered[1]).toMatchObject({
        first_name: 'Charlie',
        agent_status: 'OFFLINE',
      });
    });

    it('should handle empty agents array', () => {
      const ordered = wrapper.vm.orderAgents([]);
      expect(ordered).toEqual([]);
    });
  });

  describe('Sector Processing and Data Fetching', () => {
    it('should handle fetchSectorData method correctly', async () => {
      const sectorData = { uuid: 'test-uuid', name: 'Test Sector' };

      const isolatedWrapper = createWrapper({
        filter: {
          sector: 'sector-uuid',
          filterDate: { start: '2023-01-01', end: '2023-01-31' },
        },
      });

      vi.clearAllMocks();
      DashboardManagerApi.getRawInfo.mockResolvedValue(
        mockApiResponses.rawInfo,
      );

      const result = await isolatedWrapper.vm.fetchSectorData(sectorData);

      expect(DashboardManagerApi.getRawInfo).toHaveBeenCalled();
      expect(result).toMatchObject({ ...sectorData, total_data: 100 });

      isolatedWrapper.unmount();
    });

    it('should handle queue header specifically', async () => {
      const queueWrapper = createWrapper({ headerTitle: 'Filas' });
      await queueWrapper.vm.sectorInfo();

      expect(queueWrapper.vm.treatedSectors).toEqual(
        mockApiResponses.sectorInfo,
      );

      queueWrapper.unmount();
    });
  });

  describe('Timer Management', () => {
    it('should start metrics timer when called', () => {
      wrapper.vm.startMetricsTimer();

      expect(wrapper.vm.metricsTimer).not.toBeNull();
      expect(typeof wrapper.vm.metricsTimer).toBe('object');
    });

    it('should clear existing timer when starting new one', () => {
      wrapper.vm.metricsTimer = 12345;
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      wrapper.vm.startMetricsTimer();

      expect(clearIntervalSpy).toHaveBeenCalledWith(12345);
    });

    it('should call requestMetrics when timer triggers', () => {
      const requestMetricsSpy = vi.spyOn(wrapper.vm, 'requestMetrics');
      wrapper.vm.startMetricsTimer();

      vi.advanceTimersByTime(60000);

      expect(requestMetricsSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    const createErrorTest = (apiMethod, vmMethod) => async () => {
      const testError = new Error(`${apiMethod} failed`);
      DashboardManagerApi[apiMethod].mockRejectedValue(testError);

      await wrapper.vm[vmMethod]();

      expect(consoleSpy).toHaveBeenCalledWith(testError);
    };

    it(
      'should handle agentInfo API failures',
      createErrorTest('getAgentInfo', 'agentInfo'),
    );
    it(
      'should handle roomInfo API failures',
      createErrorTest('getRoomInfo', 'roomInfo'),
    );
    it(
      'should handle sectorInfo API failures',
      createErrorTest('getSectorInfo', 'sectorInfo'),
    );
    it(
      'should handle rawDataInfo API failures',
      createErrorTest('getRawInfo', 'rawDataInfo'),
    );
    it('should handle downloadDashboardData API failures', async () => {
      const testError = new Error('Download failed');
      DashboardManagerApi.downloadData.mockRejectedValue(testError);

      await wrapper.vm.downloadDashboardData();

      expect(consoleSpy).toHaveBeenCalledWith(testError);
    });
  });

  describe('Computed Properties', () => {
    it('should track filter updates correctly', async () => {
      const newFilter = { ...mockFilterData, sector: 'updated-sector' };

      await wrapper.setProps({ filter: newFilter });

      expect(wrapper.vm.updateFilter).toEqual(newFilter);
    });

    it('should access project from config store', () => {
      expect(wrapper.vm.project).toMatchObject({ uuid: 'project-uuid' });
    });
  });

  describe('Component Integration', () => {
    it('should have correct data structure for GeneralMetrics', () => {
      expect(wrapper.vm.generalMetrics).toEqual(expect.any(Object));
      expect(wrapper.vm.rawInfo).toEqual(expect.any(Object));
    });

    it('should have correct data structure for CardGroupMetrics', () => {
      expect(wrapper.vm.treatedSectors).toEqual(expect.any(Object));
    });

    it('should have correct data structure for TableMetrics', () => {
      expect(wrapper.vm.tableHeaders).toHaveLength(2);
      expect(wrapper.vm.agents).toEqual(expect.any(Object));
    });

    it('should maintain component name for identification', () => {
      expect(wrapper.vm.$options.name).toBe('HistoryMetricsBySector');
    });
  });

  describe('Edge Cases and Coverage Optimization', () => {
    it('should handle rawDataInfo method behavior correctly', async () => {
      const isolatedWrapper = createWrapper({
        filter: {
          sector: 'sector-uuid',
          agent: 'agent-uuid',
          tags: ['tag1'],
          filterDate: { start: '2023-01-01', end: '2023-01-31' },
        },
      });

      vi.clearAllMocks();
      DashboardManagerApi.getRawInfo.mockResolvedValue(
        mockApiResponses.rawInfo,
      );

      await isolatedWrapper.vm.rawDataInfo();
      expect(DashboardManagerApi.getRawInfo).toHaveBeenCalled();

      const result = await isolatedWrapper.vm.rawDataInfo('specific-sector');
      expect(result).toEqual(mockApiResponses.rawInfo);

      isolatedWrapper.unmount();
    });

    it('should call all metric methods in requestMetrics', () => {
      const roomInfoSpy = vi.spyOn(wrapper.vm, 'roomInfo');
      const sectorInfoSpy = vi.spyOn(wrapper.vm, 'sectorInfo');
      const rawDataInfoSpy = vi.spyOn(wrapper.vm, 'rawDataInfo');

      wrapper.vm.requestMetrics();

      expect(roomInfoSpy).toHaveBeenCalled();
      expect(sectorInfoSpy).toHaveBeenCalled();
      expect(rawDataInfoSpy).toHaveBeenCalled();
    });
  });
});
