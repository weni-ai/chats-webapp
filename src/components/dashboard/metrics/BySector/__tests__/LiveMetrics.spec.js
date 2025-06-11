import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import LiveMetricsBySector from '../LiveMetrics.vue';

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
  agent: 'Agent',
  agents_online: 'Agents online',
  'queues.title': 'Queues',
  active_chats_tooltip: 'Number of active chats',
  wait_time_tooltip: 'Average wait time',
  average_response_time: 'Average response time',
  average_interaction_time: 'Average interaction time',
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

const createWrapper = () => {
  return mount(LiveMetricsBySector, {
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

describe('LiveMetricsBySector Component', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    wrapper = createWrapper();
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Component Structure and Rendering', () => {
    it('should render main dashboard container with correct data-testid', () => {
      const dashboard = wrapper.find('[data-testid="by-sector-dashboard"]');
      expect(dashboard.exists()).toBe(true);
      expect(dashboard.classes()).toContain('by-sector-dashboard');
    });

    it('should render all sections with proper data-testids', () => {
      const generalSection = wrapper.find(
        '[data-testid="general-metrics-section"]',
      );
      const metricsSection = wrapper.find('[data-testid="metrics-section"]');

      expect(generalSection.exists()).toBe(true);
      expect(metricsSection.exists()).toBe(true);
      expect(metricsSection.classes()).toContain(
        'by-sector-dashboard__metrics',
      );
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

  describe('Data Initialization and Structure', () => {
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

    it('should initialize with correct table headers', () => {
      const expectedHeaders = [
        { text: 'Agent', value: 'name' },
        { text: 'Active chats', value: 'activeChats' },
      ];

      expect(wrapper.vm.tableHeaders).toEqual(expectedHeaders);
    });

    it('should initialize with active chats data', () => {
      const activeChats = wrapper.vm.activeChats;

      expect(activeChats).toHaveLength(3);
      expect(activeChats[0]).toMatchObject({
        id: 1,
        name: 'Fabricio Correiaaaaaaaaaaaa',
        activeChats: 3,
      });
    });

    it('should initialize realtime controller after mount', () => {
      expect(wrapper.vm.realtimeSimulationController).not.toBeNull();
      expect(typeof wrapper.vm.realtimeSimulationController).toBe('object');
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
    it('should initialize realtime simulation on mount', () => {
      expect(wrapper.vm.realtimeSimulationController).not.toBeNull();
      expect(typeof wrapper.vm.realtimeSimulationController).toBe('object');
    });

    it('should clear interval on unmount', () => {
      const controllerId = wrapper.vm.realtimeSimulationController;
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      wrapper.unmount();

      expect(clearIntervalSpy).toHaveBeenCalledWith(controllerId);
    });
  });

  describe('Realtime Simulation Methods', () => {
    it('should update random metric when interval triggers', () => {
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

    it('should advance timers and trigger metric updates', () => {
      const originalMethod = LiveMetricsBySector.methods.updateRandomMetric;
      const updateSpy = vi.fn();
      LiveMetricsBySector.methods.updateRandomMetric = updateSpy;

      const testWrapper = createWrapper();

      vi.advanceTimersByTime(5000);

      expect(updateSpy).toHaveBeenCalledTimes(1);

      LiveMetricsBySector.methods.updateRandomMetric = originalMethod;
      testWrapper.unmount();
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

    it('should handle value going below 1 for non-time metrics', () => {
      wrapper.vm.generalMetrics[0].value = 1;

      const mathRandomSpy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.4);

      wrapper.vm.updateRandomMetric();

      expect(wrapper.vm.generalMetrics[0].value).toBe(1);
      mathRandomSpy.mockRestore();
    });

    it('should skip updates based on random chance', () => {
      const initialValue = wrapper.vm.generalMetrics[0].value;
      const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

      wrapper.vm.updateRandomMetric();

      expect(wrapper.vm.generalMetrics[0].value).toBe(initialValue);
      mathRandomSpy.mockRestore();
    });

    it('should handle empty sectors gracefully', async () => {
      const wrapperWithEmptyQueues = mount(LiveMetricsBySector, {
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
      expect(wrapper.vm.activeChats[0]).toHaveProperty('name');
      expect(wrapper.vm.activeChats[0]).toHaveProperty('activeChats');
    });

    it('should maintain component name for identification', () => {
      expect(wrapper.vm.$options.name).toBe('LiveMetricsBySector');
    });
  });
});
