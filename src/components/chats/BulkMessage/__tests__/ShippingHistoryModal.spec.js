import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import moment from 'moment';

import ShippingHistoryModal from '../ShippingHistoryModal/index.vue';
import { statusLabel, statusScheme } from '../ShippingHistoryModal/status';
import BulkMessageService from '@/services/api/resources/chats/bulkMessage';
import ProjectService from '@/services/api/resources/settings/project';

vi.mock('@/services/api/resources/chats/bulkMessage', () => ({
  default: {
    getShippingHistory: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    agents: vi.fn(),
  },
}));

describe('ShippingHistoryModal', () => {
  let wrapper;

  const historyItem = {
    contact: { name: 'Alice' },
    queue: { name: 'Support' },
    sent_by: { name: 'Agent' },
    date: '2026-07-28T10:00:00Z',
    status: 'SUCCESS',
  };

  const createWrapper = () => mount(ShippingHistoryModal);

  beforeEach(() => {
    vi.clearAllMocks();
    ProjectService.agents.mockResolvedValue({
      results: [
        {
          user: {
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'jane@test.com',
          },
        },
      ],
      next: null,
    });
    BulkMessageService.getShippingHistory.mockResolvedValue({
      count: 1,
      results: [historyItem],
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should fetch senders and history on mount', async () => {
    wrapper = createWrapper();
    await flushPromises();

    const today = moment().format('YYYY-MM-DD');

    expect(ProjectService.agents).toHaveBeenCalled();
    expect(BulkMessageService.getShippingHistory).toHaveBeenCalledWith({
      offset: 0,
      limit: 5,
      start_date: today,
      end_date: today,
      sender: undefined,
      status: undefined,
    });
    expect(
      wrapper.find('[data-testid="shipping-history-table"]').exists(),
    ).toBe(true);
  });

  it('should show empty state when there are no results', async () => {
    BulkMessageService.getShippingHistory.mockResolvedValue({
      count: 0,
      results: [],
    });

    wrapper = createWrapper();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="shipping-history-no-results"]').exists(),
    ).toBe(true);
  });

  it('should clear table data when history request fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    BulkMessageService.getShippingHistory.mockRejectedValue(
      new Error('network'),
    );

    wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.historyItems).toEqual([]);
    expect(wrapper.vm.historyCount).toBe(0);
    expect(wrapper.vm.historyCountPages).toBe(0);
    expect(
      wrapper.find('[data-testid="shipping-history-no-results"]').exists(),
    ).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should emit close when dialog is closed', async () => {
    wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.isOpen = false;
    await flushPromises();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should paginate history without resetting current page', async () => {
    BulkMessageService.getShippingHistory.mockResolvedValue({
      count: 12,
      results: [historyItem],
    });

    wrapper = createWrapper();
    await flushPromises();

    BulkMessageService.getShippingHistory.mockClear();
    await wrapper.vm.handlePageChange(2);
    await flushPromises();

    expect(wrapper.vm.currentPage).toBe(2);
    expect(BulkMessageService.getShippingHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 5,
        limit: 5,
      }),
    );
  });

  it('should map status labels and schemes', () => {
    expect(statusLabel('FAILED')).toContain('Failed');
    expect(statusScheme('FAILED')).toBe('red');
    expect(statusScheme('SUCCESS')).toBe('green');
  });

  it('should compute pagination range', async () => {
    BulkMessageService.getShippingHistory.mockResolvedValue({
      count: 12,
      results: [historyItem],
    });

    wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.paginationFrom).toBe(1);
    expect(wrapper.vm.paginationTo).toBe(5);

    wrapper.vm.currentPage = 3;
    await flushPromises();

    expect(wrapper.vm.paginationFrom).toBe(11);
    expect(wrapper.vm.paginationTo).toBe(12);
  });
});
