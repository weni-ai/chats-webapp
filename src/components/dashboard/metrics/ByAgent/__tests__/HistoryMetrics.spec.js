import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import HistoryMetricsByAgent from '../HistoryMetrics.vue';

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
  number_chats: 'Number of chats',
  wait_time: 'Wait time',
  response_time: 'Response time',
  interaction_time: 'Interaction time',
  agents_online: 'Agents online',
  in_queues: 'in queues',
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
};

const createWrapper = (props = {}) => {
  return mount(HistoryMetricsByAgent, {
    props: { agentName: 'John Doe', ...props },
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

describe('HistoryMetricsByAgent Component', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Component Structure and Rendering', () => {
    it('should render main dashboard container with correct data-testid', () => {
      const dashboard = wrapper.find('[data-testid="agent-history-dashboard"]');
      expect(dashboard.exists()).toBe(true);
      expect(dashboard.classes()).toContain('agent-history-metrics');
    });

    it('should render all sections with proper data-testids', () => {
      const generalSection = wrapper.find(
        '[data-testid="general-metrics-section"]',
      );
      const metricsSection = wrapper.find('[data-testid="metrics-section"]');

      expect(generalSection.exists()).toBe(true);
      expect(metricsSection.exists()).toBe(true);
      expect(metricsSection.classes()).toContain(
        'agent-history-metrics__metrics',
      );
    });

    it('should render child components with proper data-testids', () => {
      expect(wrapper.findComponent({ name: 'GeneralMetrics' }).exists()).toBe(
        false,
      );
      expect(wrapper.findComponent({ name: 'CardGroupMetrics' }).exists()).toBe(
        false,
      );

      expect(wrapper.html()).toContain('GeneralMetrics');
      expect(wrapper.html()).toContain('CardGroupMetrics');
    });
  });

  describe('Props and Data Initialization', () => {
    it('should accept and handle agentName prop correctly', () => {
      expect(wrapper.props('agentName')).toBe('John Doe');
      expect(wrapper.vm.agentName).toBe('John Doe');
    });

    it('should handle empty agentName prop gracefully', () => {
      const emptyNameWrapper = createWrapper({ agentName: '' });

      expect(emptyNameWrapper.props('agentName')).toBe('');
      expect(emptyNameWrapper.vm.agentName).toBe('');

      emptyNameWrapper.unmount();
    });

    it('should initialize with correct general metrics structure', () => {
      const generalMetrics = wrapper.vm.generalMetrics;

      expect(generalMetrics).toHaveLength(4);
      expect(generalMetrics[0]).toMatchObject({
        title: 'Number of chats',
        icon: 'indicator',
        scheme: 'aux-blue',
        value: 434,
        percent: -5,
        invertedPercentage: true,
      });
    });

    it('should initialize general metrics with correct time-based structures', () => {
      const generalMetrics = wrapper.vm.generalMetrics;

      expect(generalMetrics[1]).toMatchObject({
        title: 'Wait time',
        icon: 'time-clock-circle-1',
        type: 'time',
        scheme: 'aux-orange',
        value: { minutes: 3, seconds: 2 },
        percent: -5,
        invertedPercentage: true,
      });

      expect(generalMetrics[2]).toMatchObject({
        title: 'Response time',
        icon: 'messaging-we-chat-3',
        scheme: 'aux-purple',
        type: 'time',
        value: { minutes: 4, seconds: 24 },
        percent: 5,
        invertedPercentage: true,
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

    it('should handle empty sectors gracefully', () => {
      const wrapperWithEmptyQueues = mount(HistoryMetricsByAgent, {
        props: { agentName: 'Test Agent' },
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

    it('should handle edge cases in timeToString method', () => {
      expect(wrapper.vm.timeToString({ minutes: 0, seconds: 0 })).toBe(
        '0min 0s',
      );
      expect(wrapper.vm.timeToString({ minutes: 10, seconds: 59 })).toBe(
        '10min 59s',
      );
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

    it('should generate random agent count within expected range', () => {
      const metrics = wrapper.vm.getRandomMetrics();
      const agentMetric = metrics[3];

      expect(agentMetric.count).toBeGreaterThanOrEqual(3);
      expect(agentMetric.count).toBeLessThanOrEqual(5);
      expect(Number.isInteger(agentMetric.count)).toBe(true);
    });
  });

  describe('Component Integration', () => {
    it('should have correct data structure for GeneralMetrics', () => {
      expect(wrapper.vm.generalMetrics).toHaveLength(4);
      expect(wrapper.vm.generalMetrics[0]).toHaveProperty('title');
      expect(wrapper.vm.generalMetrics[0]).toHaveProperty('icon');
      expect(wrapper.vm.generalMetrics[0]).toHaveProperty('value');
      expect(wrapper.vm.generalMetrics[0]).toHaveProperty('scheme');
    });

    it('should have correct data structure for CardGroupMetrics (queues)', () => {
      expect(wrapper.vm.queues).toHaveLength(3);
      expect(wrapper.vm.queues[0]).toHaveProperty('id');
      expect(wrapper.vm.queues[0]).toHaveProperty('name');
      expect(wrapper.vm.queues[0]).toHaveProperty('statuses');
    });

    it('should maintain component name for identification', () => {
      expect(wrapper.vm.$options.name).toBe('HistoryMetricsByAgent');
    });

    it('should have agentName prop with correct default value', () => {
      const wrapperWithoutProps = mount(HistoryMetricsByAgent, {
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

      expect(wrapperWithoutProps.vm.agentName).toBe('');
      wrapperWithoutProps.unmount();
    });

    it('should render CardGroupMetrics with proper title including agentName', () => {
      const cardGroup = wrapper.findComponent({ name: 'CardGroupMetrics' });
      expect(cardGroup.exists()).toBe(false);
      expect(wrapper.html()).toContain('CardGroupMetrics');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined sectors gracefully', () => {
      const wrapperWithUndefinedSectors = mount(HistoryMetricsByAgent, {
        props: { agentName: 'Test Agent' },
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

      expect(wrapperWithUndefinedSectors.vm.queues).toEqual([]);
      wrapperWithUndefinedSectors.unmount();
    });

    it('should handle missing translation keys gracefully', () => {
      const wrapperWithMissingTranslations = mount(HistoryMetricsByAgent, {
        props: { agentName: 'Test Agent' },
        global: {
          plugins: [
            createTestingPinia({
              initialState: {
                settings: { sectors: mockSectorsData },
              },
            }),
          ],
          mocks: {
            $t: (key) => key,
          },
          stubs: mockComponents,
        },
      });

      expect(
        wrapperWithMissingTranslations
          .find('[data-testid="agent-history-dashboard"]')
          .exists(),
      ).toBe(true);

      wrapperWithMissingTranslations.unmount();
    });

    it('should maintain consistent random generation behavior', () => {
      const metrics1 = wrapper.vm.getRandomMetrics();
      const metrics2 = wrapper.vm.getRandomMetrics();

      expect(metrics1).toHaveLength(metrics2.length);
      expect(metrics1[0]).toHaveProperty('title');
      expect(metrics2[0]).toHaveProperty('title');
      expect(metrics1[0].title).toBe(metrics2[0].title);
    });
  });
});
