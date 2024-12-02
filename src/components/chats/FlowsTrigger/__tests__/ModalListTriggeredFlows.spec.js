import { flushPromises, mount } from '@vue/test-utils';
import { expect, describe, it, beforeEach, vi } from 'vitest';

import ModalListTriggeredFlows from '../ModalListTriggeredFlows.vue';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';

vi.mock('@/services/api/resources/chats/flowsTrigger.js', () => ({
  default: {
    listFlowsStart: vi.fn(() => {
      return Promise.resolve({
        results: [{ name: 'Flow 1', created_on: '2024-11-10T12:00:00Z' }],
        count: 1,
      });
    }),
  },
}));

describe('ModalListTriggeredFlows', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ModalListTriggeredFlows);
  });

  it('renders correctly', () => {
    expect(
      wrapper.find('[data-testid="modal-list-triggered-flows"]').exists(),
    ).toBe(true);

    expect(
      wrapper
        .findComponent(
          '[data-testid="modal-list-triggered-flows-table-pagination"]',
        )
        .exists(),
    ).toBe(true);
  });

  it('fetches and updates triggeredFlows data', async () => {
    const listFlowsStartSpy = vi.spyOn(FlowsTrigger, 'listFlowsStart');

    const wrapper = mount(ModalListTriggeredFlows);
    await flushPromises();

    expect(listFlowsStartSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: wrapper.vm.triggeredFlowsLimit,
      }),
    );
    expect(wrapper.vm.triggeredFlows).toEqual([
      { name: 'Flow 1', created_on: '2024-11-10T12:00:00Z' },
    ]);
  });

  it('updates flows when filterDate changes', async () => {
    const getListFlowsStartSpy = vi.spyOn(wrapper.vm, 'getListFlowsStart');

    await wrapper.setData({
      filterDate: { start: '2024-11-01', end: '2024-11-10' },
    });

    await wrapper.vm.$nextTick();

    expect(getListFlowsStartSpy).toHaveBeenCalled();
  });

  it('displays no results message when triggeredFlows is empty', async () => {
    await wrapper.setData({ triggeredFlows: [], isTableLoading: false });
    const noResultsMessage = wrapper.find('[data-testid="no-results-text"]');
    expect(noResultsMessage.exists()).toBe(true);
    expect(noResultsMessage.text()).toBe(wrapper.vm.$t('without_results'));
  });

  it('updates current page when TablePagination emits event', async () => {
    const newPage = 2;
    wrapper
      .findComponent(
        '[data-testid="modal-list-triggered-flows-table-pagination"]',
      )
      .vm.$emit('update:model-value', newPage);

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.triggeredFlowsCurrentPage).toBe(newPage);
  });

  it('should emits close on trigger close from modal', async () => {
    const modal = wrapper.findComponent(
      '[data-testid="modal-list-triggered-flows"]',
    );
    await modal.vm.$emit('close');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should log error on fail getListFlowsStart', async () => {
    vi.spyOn(FlowsTrigger, 'listFlowsStart').mockRejectedValueOnce(
      new Error('API Error'),
    );
    const consoleLogSpy = vi.spyOn(console, 'log');

    await wrapper.vm.getListFlowsStart();

    expect(consoleLogSpy).toHaveBeenCalledWith(new Error('API Error'));
  });
});
