import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import GeneralMetrics from '../GeneralMetrics.vue';

const createWrapper = (props = {}) => {
  return mount(GeneralMetrics, {
    props: {
      metrics: {
        rooms_data: [
          { waiting_time: 3600, response_time: 180, interact_time: 7200 },
        ],
      },
      rawData: {
        raw_data: [{ active_rooms: 10, queue_rooms: 5, closed_rooms: 3 }],
      },
      generalLabel: 'in_progress',
      ...props,
    },
  });
};

describe('GeneralMetrics.vue', () => {
  it('renders correctly with given props', () => {
    const wrapper = createWrapper();

    expect(wrapper.findAll('[data-testid="general-metric-card"]')).toHaveLength(
      6,
    );
  });

  it('formats time correctly using timeToString', () => {
    const wrapper = createWrapper();

    const instance = wrapper.vm;
    expect(instance.timeToString(3600)).toBe('01h00min 00s');
    expect(instance.timeToString(180)).toBe('03min 00s');
    expect(instance.timeToString(59)).toBe('59s');
    expect(instance.timeToString(0)).toBe('00s');
  });
});
