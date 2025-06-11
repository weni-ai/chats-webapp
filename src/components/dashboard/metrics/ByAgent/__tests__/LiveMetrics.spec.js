import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import LiveMetricsByAgent from '../LiveMetrics.vue';

const mockSectorsData = [
  {
    id: 1,
    name: 'Support',
    queues: [
      { id: 1, name: 'Queue 1' },
      { id: 2, name: 'Queue 2' },
      { id: 3, name: 'Queue 3' },
    ],
  },
];

const mockTranslations = {
  active_chats: 'Active chats',
  wait_time: 'Wait time',
  response_time: 'Response time',
  interaction_time: 'Interaction time',
  contact: 'Contact',
  agents_online: 'Agents online',
  'queues.title': 'Queues',
  active_chats_tooltip: 'Number of active chats',
  wait_time_tooltip: 'Average wait time',
  average_response_time: 'Average response time',
  average_interaction_time: 'Average interaction time',
};

const mockAgentsData = {
  project_agents: [
    { id: 1, name: 'Agent 1', chats: 3 },
    { id: 2, name: 'Agent 2', chats: 5 },
  ],
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
  return mount(LiveMetricsByAgent, {
    props: { agents: mockAgentsData, ...props },
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            settings: { sectors: mockSectorsData },
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

describe('LiveMetricsByAgent Component', () => {
  let wrapper;
  let consoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
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
      const dashboard = wrapper.find('[data-testid="by-agent-dashboard"]');
      expect(dashboard.exists()).toBe(true);
      expect(dashboard.classes()).toContain('by-agent-dashboard');
    });

    it('should render all sections with proper data-testids', () => {
      const generalSection = wrapper.find(
        '[data-testid="general-metrics-section"]',
      );
      const metricsSection = wrapper.find('[data-testid="metrics-section"]');

      expect(generalSection.exists()).toBe(true);
      expect(metricsSection.exists()).toBe(true);
      expect(metricsSection.classes()).toContain('by-agent-dashboard__metrics');
    });

    it('should render all child components with proper data-testids', () => {
      expect(wrapper.findComponent({ name: 'GeneralMetrics' }).exists()).toBe(
        false,
      );
      expect(wrapper.findComponent({ name: 'CardGroupMetrics' }).exists()).toBe(
        false,
      );
      expect(wrapper.findComponent({ name: 'TableMetrics' }).exists()).toBe(
        false,
      );

      expect(wrapper.html()).toContain('GeneralMetrics');
      expect(wrapper.html()).toContain('CardGroupMetrics');
      expect(wrapper.html()).toContain('TableMetrics');
    });
  });

  describe('Props and Data Initialization', () => {
    it('should accept and handle agents prop correctly', () => {
      expect(wrapper.props('agents')).toEqual(mockAgentsData);
      expect(wrapper.vm.agents).toEqual(mockAgentsData);
    });

    it('should initialize with correct general metrics structure', () => {
      const generalMetrics = wrapper.vm.generalMetrics;

      expect(generalMetrics).toHaveLength(4);
      expect(generalMetrics[0]).toMatchObject({
        title: 'Active chats',
        icon: 'indicator',
        scheme: 'aux-blue',
        value: 5,
        percent: -5,
        invertedPercentage: true,
      });
    });

    it('should initialize with correct table headers for agent view', () => {
      const expectedHeaders = [
        { text: 'Contact', value: 'contact' },
        { text: 'Interaction time', value: 'interactionTime' },
      ];

      expect(wrapper.vm.tableHeaders).toEqual(expectedHeaders);
    });

    it('should initialize with active chats data', () => {
      const activeChats = wrapper.vm.activeChats;

      expect(activeChats).toHaveLength(3);
      expect(activeChats[0]).toMatchObject({
        id: 1,
        contact: 'John Doe',
        interactionTime: '5min 30s',
      });
    });
  });

  describe('Computed Properties', () => {
    it('should compute queues from sectors store data', () => {
      const queues = wrapper.vm.queues;

      expect(queues).toHaveLength(3);
      expect(queues[0]).toMatchObject({
        id: 1,
        name: 'Queue 1',
        statuses: expect.any(Array),
      });
    });

    it('should generate random metrics for each queue', () => {
      const queues = wrapper.vm.queues;

      queues.forEach((queue) => {
        expect(queue.statuses).toHaveLength(4);
        expect(queue.statuses[0]).toMatchObject({
          title: 'Wait time',
          icon: 'time-clock-circle-1',
          scheme: 'aux-orange',
          count: expect.any(String),
        });
      });
    });
  });

  describe('Lifecycle Management', () => {
    it('should log agents data on mount', () => {
      expect(consoleSpy).toHaveBeenCalledWith(mockAgentsData, 'agent');
    });

    it('should clear interval on unmount', () => {
      wrapper.vm.realtimeSimulationController = 12345;
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      wrapper.unmount();

      expect(clearIntervalSpy).toHaveBeenCalledWith(12345);
    });

    it('should handle unmount with null controller gracefully', () => {
      wrapper.vm.realtimeSimulationController = null;
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      expect(() => wrapper.unmount()).not.toThrow();
      expect(clearIntervalSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('Realtime Simulation Methods', () => {
    it('should initialize realtime simulation when called', () => {
      wrapper.vm.initRealtimeSimulation();

      expect(wrapper.vm.realtimeSimulationController).not.toBeNull();
      expect(typeof wrapper.vm.realtimeSimulationController).toBe('object');
    });

    it('should update random metric when updateRandomMetric is called', () => {
      const initialValue = wrapper.vm.generalMetrics[0].value;
      const mathRandomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.0)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0.6);

      wrapper.vm.updateRandomMetric();

      const updatedValue = wrapper.vm.generalMetrics[0].value;
      expect(updatedValue).toBe(initialValue + 1);

      mathRandomSpy.mockRestore();
    });

    it('should handle time-based metric updates correctly', () => {
      const mathRandomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.25)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0.6);

      const initialSeconds = wrapper.vm.generalMetrics[1].value.seconds;
      wrapper.vm.updateRandomMetric();

      expect(wrapper.vm.generalMetrics[1].value.seconds).toBe(
        initialSeconds + 1,
      );
      mathRandomSpy.mockRestore();
    });

    it('should handle percent-based metric updates correctly', () => {
      const mathRandomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.0)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.6);

      const initialPercent = wrapper.vm.generalMetrics[0].percent;
      wrapper.vm.updateRandomMetric();

      expect(wrapper.vm.generalMetrics[0].percent).toBe(initialPercent + 1);
      mathRandomSpy.mockRestore();
    });

    it('should handle seconds overflow (> 59) in time updates', () => {
      wrapper.vm.generalMetrics[1].value.seconds = 60;

      const mathRandomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.25)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0.6);

      wrapper.vm.updateRandomMetric();

      expect(wrapper.vm.generalMetrics[1].value.seconds).toBe(0);
      mathRandomSpy.mockRestore();
    });

    it('should prevent non-time metric values from going below 1', () => {
      wrapper.vm.generalMetrics[0].value = 1;

      const mathRandomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.0)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0.4);

      wrapper.vm.updateRandomMetric();

      expect(wrapper.vm.generalMetrics[0].value).toBe(1);
      mathRandomSpy.mockRestore();
    });
  });

  describe('Utility Methods', () => {
    it('should generate random time within specified range', () => {
      const time = wrapper.vm.getRandomTime(2, 5);

      expect(time).toMatchObject({
        minutes: expect.any(Number),
        seconds: expect.any(Number),
      });
      expect(time.minutes).toBeGreaterThanOrEqual(2);
      expect(time.minutes).toBeLessThanOrEqual(5);
      expect(time.seconds).toBeGreaterThanOrEqual(0);
      expect(time.seconds).toBeLessThanOrEqual(59);
    });

    it('should convert time object to string format', () => {
      const timeString = wrapper.vm.timeToString({ minutes: 3, seconds: 45 });
      expect(timeString).toBe('3min 45s');
    });

    it('should generate random metrics with correct structure', () => {
      const metrics = wrapper.vm.getRandomMetrics();

      expect(metrics).toHaveLength(4);
      expect(metrics[0]).toMatchObject({
        title: 'Wait time',
        icon: 'time-clock-circle-1',
        scheme: 'aux-orange',
        count: expect.any(String),
      });
      expect(metrics[3]).toMatchObject({
        title: 'Online agents',
        icon: 'headphones-customer-support-human-1-1',
        scheme: 'aux-blue',
        count: expect.any(Number),
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative seconds in time updates', () => {
      wrapper.vm.generalMetrics[1].type = 'time';
      wrapper.vm.generalMetrics[1].value.seconds = 0;

      const mathRandomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.4);

      wrapper.vm.updateRandomMetric();

      expect(wrapper.vm.generalMetrics[1].value.seconds).toBe(0);
      mathRandomSpy.mockRestore();
    });

    it('should skip updates based on random chance', () => {
      const initialValue = wrapper.vm.generalMetrics[0].value;
      const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

      wrapper.vm.updateRandomMetric();

      expect(wrapper.vm.generalMetrics[0].value).toBe(initialValue);
      mathRandomSpy.mockRestore();
    });

    it('should handle empty agents prop gracefully', () => {
      const emptyAgentsWrapper = createWrapper({ agents: {} });

      expect(emptyAgentsWrapper.vm.agents).toEqual({});
      expect(
        emptyAgentsWrapper.find('[data-testid="by-agent-dashboard"]').exists(),
      ).toBe(true);

      emptyAgentsWrapper.unmount();
    });

    it('should handle empty sectors gracefully', async () => {
      const wrapperWithEmptyQueues = mount(LiveMetricsByAgent, {
        props: { agents: mockAgentsData },
        global: {
          plugins: [
            createTestingPinia({
              initialState: {
                settings: { sectors: [{ queues: [] }] },
              },
            }),
          ],
          mocks: {
            $t: (key) => mockTranslations[key] || key,
          },
          stubs: mockComponents,
        },
      });

      expect(wrapperWithEmptyQueues.vm.queues).toEqual([]);
      wrapperWithEmptyQueues.unmount();
    });
  });

  describe('Component Integration', () => {
    it('should have correct data structure for GeneralMetrics', () => {
      expect(wrapper.vm.generalMetrics).toHaveLength(4);
      expect(wrapper.vm.generalMetrics[0]).toHaveProperty('title');
      expect(wrapper.vm.generalMetrics[0]).toHaveProperty('icon');
      expect(wrapper.vm.generalMetrics[0]).toHaveProperty('value');
    });

    it('should have correct data structure for CardGroupMetrics (queues)', () => {
      expect(wrapper.vm.queues).toHaveLength(3);
      expect(wrapper.vm.queues[0]).toHaveProperty('id');
      expect(wrapper.vm.queues[0]).toHaveProperty('name');
      expect(wrapper.vm.queues[0]).toHaveProperty('statuses');
    });

    it('should have correct data structure for TableMetrics', () => {
      expect(wrapper.vm.tableHeaders).toHaveLength(2);
      expect(wrapper.vm.activeChats).toHaveLength(3);
      expect(wrapper.vm.activeChats[0]).toHaveProperty('id');
      expect(wrapper.vm.activeChats[0]).toHaveProperty('contact');
      expect(wrapper.vm.activeChats[0]).toHaveProperty('interactionTime');
    });

    it('should maintain component name for identification', () => {
      expect(wrapper.vm.$options.name).toBe('LiveMetricsByAgent');
    });

    it('should have agents prop with correct default value', () => {
      const wrapperWithoutProps = mount(LiveMetricsByAgent, {
        global: {
          plugins: [
            createTestingPinia({
              initialState: {
                settings: { sectors: mockSectorsData },
              },
            }),
          ],
          mocks: {
            $t: (key) => mockTranslations[key] || key,
          },
          stubs: mockComponents,
        },
      });

      expect(wrapperWithoutProps.vm.agents).toEqual({});
      wrapperWithoutProps.unmount();
    });
  });
});
