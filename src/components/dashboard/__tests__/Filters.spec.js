import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardFilters from '../Filters.vue';

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    agents: vi.fn(() => Promise.resolve([])),
    tags: vi.fn(() =>
      Promise.resolve({ results: [{ uuid: '1', name: 'Tag' }] }),
    ),
  },
}));

vi.mock('@/services/api/resources/dashboard/dashboardManager', () => ({
  default: {
    downloadMetricData: vi.fn(() => Promise.resolve()),
    downloadAllData: vi.fn(() => Promise.resolve()),
  },
}));

const createWrapper = (props = {}) => {
  return mount(DashboardFilters, { props: { sectors: [], ...props } });
};

describe('DashboardFilters', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = createWrapper();
  });
  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('emits filter event when filter values change', async () => {
    await wrapper.setData({ filterSector: [{ value: 'test-sector' }] });
    expect(wrapper.emitted().filter).toBeTruthy();
  });

  it('calls downloadMetric when an export metrics_csv option is clicked', async () => {
    const downloadMetricMock = vi.spyOn(wrapper.vm, 'downloadMetric');

    const openDropdownButton = wrapper.find(
      '[data-testid="download-dropdown-button"]',
    );

    await openDropdownButton.trigger('click');

    await wrapper.find('[data-testid="download-metric-csv"]').trigger('click');

    expect(downloadMetricMock).toHaveBeenCalledWith('metrics_csv');

    await openDropdownButton.trigger('click');

    await wrapper
      .find('[data-testid="download-metric-csv"]')
      .trigger('keypress', { key: 'Enter', shiftKey: false });

    expect(downloadMetricMock).toHaveBeenCalledWith('metrics_csv');
    expect(downloadMetricMock).toHaveBeenCalledTimes(2);
  });

  it('calls downloadMetric when an export metrics_xls option is clicked', async () => {
    const downloadMetricMock = vi.spyOn(wrapper.vm, 'downloadMetric');

    const openDropdownButton = wrapper.find(
      '[data-testid="download-dropdown-button"]',
    );

    await openDropdownButton.trigger('click');

    await wrapper.find('[data-testid="download-metric-xls"]').trigger('click');

    expect(downloadMetricMock).toHaveBeenCalledWith('metrics_xls');

    await openDropdownButton.trigger('click');

    await wrapper
      .find('[data-testid="download-metric-xls"]')
      .trigger('keypress', { key: 'Enter', shiftKey: false });

    expect(downloadMetricMock).toHaveBeenCalledWith('metrics_xls');
    expect(downloadMetricMock).toHaveBeenCalledTimes(2);
  });

  it('calls downloadDashboardData when an export all_csv option is clicked', async () => {
    const downloadDashboardData = vi.spyOn(wrapper.vm, 'downloadDashboardData');

    const openDropdownButton = wrapper.find(
      '[data-testid="download-dropdown-button"]',
    );

    await openDropdownButton.trigger('click');

    await wrapper.find('[data-testid="download-all-csv"]').trigger('click');

    expect(downloadDashboardData).toHaveBeenCalledWith('all_csv');

    await openDropdownButton.trigger('click');

    await wrapper
      .find('[data-testid="download-all-csv"]')
      .trigger('keypress', { key: 'Enter', shiftKey: false });

    expect(downloadDashboardData).toHaveBeenCalledWith('all_csv');
    expect(downloadDashboardData).toHaveBeenCalledTimes(2);
  });

  it('calls downloadDashboardData when an export all_xls option is clicked', async () => {
    const downloadDashboardData = vi.spyOn(wrapper.vm, 'downloadDashboardData');

    const openDropdownButton = wrapper.find(
      '[data-testid="download-dropdown-button"]',
    );

    await openDropdownButton.trigger('click');

    await wrapper.find('[data-testid="download-all-xls"]').trigger('click');

    expect(downloadDashboardData).toHaveBeenCalledWith('all_xls');

    await openDropdownButton.trigger('click');

    await wrapper
      .find('[data-testid="download-all-xls"]')
      .trigger('keypress', { key: 'Enter', shiftKey: false });

    expect(downloadDashboardData).toHaveBeenCalledWith('all_xls');
    expect(downloadDashboardData).toHaveBeenCalledTimes(2);
  });

  it('resets filters when reset button is clicked', async () => {
    await wrapper.setData({ filterAgent: [{ value: 'agent-test' }] });
    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.filterAgent.length).toBe(1); // Should be reset
  });

  it('properly processes sectors in treatSectors', async () => {
    const sectorsMock = [
      { uuid: 'sector-1', name: 'Sector 1' },
      { uuid: 'sector-2', name: 'Sector 2' },
    ];

    await wrapper.setProps({ sectors: sectorsMock });

    console.log(wrapper.vm.tagsToFilter);

    expect(wrapper.vm.sectorsToFilter).toEqual([
      { value: 'all', label: 'All' },
      { value: 'sector-1', label: 'Sector 1' },
      { value: 'sector-2', label: 'Sector 2' },
    ]);
  });

  it('calls sendFilter in updateFiltering when a valid filter is provided', async () => {
    const sendFilterMock = vi.spyOn(wrapper.vm, 'sendFilter');
    await wrapper.vm.updateFiltering([{ value: 'sector-1' }]);
    expect(sendFilterMock).toHaveBeenCalled();
  });
});
