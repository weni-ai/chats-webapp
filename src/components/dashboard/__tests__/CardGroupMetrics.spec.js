import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

import CardGroupMetrics from '../CardGroupMetrics.vue';

const createWrapper = (props = {}) => {
  return mount(CardGroupMetrics, { props });
};

describe('CardGroupMetrics', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });
  it('should render with default props', () => {
    expect(wrapper.props().icon).toBe('');
    expect(wrapper.props().scheme).toBe('aux-blue');
    expect(wrapper.props().title).toBe('');
    expect(wrapper.props().totalChatsLabel).toBe('');
    expect(wrapper.props().allMetrics).toBe(false);
  });

  it('should compute orderedMetrics correctly', async () => {
    const metrics = {
      sectors: [
        { name: 'B', active_rooms: 2, closed_rooms: 1, queue_rooms: 0 },
        { name: 'A', active_rooms: 1, closed_rooms: 0, queue_rooms: 0 },
      ],
    };

    await wrapper.setProps({ metrics });

    const orderedMetrics = wrapper.vm.orderedMetrics;

    expect(orderedMetrics[0].name).toBe('A');
    expect(orderedMetrics[1].name).toBe('B');
  });

  it('should handle timeToString method correctly', () => {
    expect(wrapper.vm.timeToString(3600)).toBe('01h00min 00s');
    expect(wrapper.vm.timeToString(61)).toBe('01min 01s');
    expect(wrapper.vm.timeToString(0)).toBe('00s');
  });

  it('should return correct value from showRoomMetrics', () => {
    expect(wrapper.vm.showRoomMetrics({ active_rooms: 2 })).toBe(true);
    expect(
      wrapper.vm.showRoomMetrics({ active_chats: 0, closed_rooms: 0 }),
    ).toBe(false);
  });

  it('should render metrics correctly', async () => {
    const metrics = {
      sectors: [
        {
          name: 'A',
          active_rooms: 1,
          closed_rooms: 1,
          queue_rooms: 1,
          waiting_time: 120,
          response_time: 30,
          interact_time: 45,
        },
      ],
    };

    await wrapper.setProps({ metrics, allMetrics: true });

    const card = wrapper.findAllComponents('[data-testid="metric-card"]');

    expect(card.length).toBe(1);
    expect(card[0].props('name')).toBe('A');
    expect(card[0].props('statuses').length).toBeGreaterThan(0);
  });
});
