import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTestingPinia } from '@pinia/testing';

import { useConfig } from '@/store/modules/config';
import { useDashboard } from '@/store/modules/dashboard';

import Sector from '@/services/api/resources/settings/sector';

import DashboardManager from '../index.vue';

import DashboardLayout from '@/layouts/DashboardLayout/index.vue';

import ViewMode from '@/views/Dashboard/ViewMode/index.vue';

import DashboardFilters from '@/components/dashboard/Filters.vue';

import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics.vue';

const createWrapper = () => {
  return mount(DashboardManager, {
    global: {
      components: {
        DashboardLayout,
        ViewMode,
        DashboardFilters,
        HistoryMetricsBySector,
      },
      plugins: [
        createTestingPinia({
          initialState: {
            config: { project: { name: 'Test Project' } },
            dashboard: { viewedAgent: { email: 'test@domain.com' } },
          },
        }),
      ],
    },
  });
};

describe('DashboardManager', () => {
  let wrapper;
  let configStore;
  let dashboardStore;
  beforeEach(() => {
    wrapper = createWrapper();

    configStore = useConfig();
    dashboardStore = useDashboard();
  });
  it('should render the ViewMode component when viewedAgent has email', () => {
    const viewMode = wrapper.findComponent({ name: 'ViewMode' });
    expect(viewMode.exists()).toBe(true);
  });

  it('should render the DashboardLayout component when viewedAgent does not have email', async () => {
    dashboardStore.viewedAgent.email = '';
    await wrapper.vm.$nextTick();
    const dashboardLayout = wrapper.findComponent({ name: 'DashboardLayout' });
    expect(dashboardLayout.exists()).toBe(true);
  });

  //   it('should display the correct header', () => {
  //     const wrapper = mount(DashboardManager);

  //     const header = wrapper.find('.header');
  //     expect(header.text()).toBe('Test Project');
  //   });

  //   it('should compute visualization correctly', async () => {
  //     const wrapper = mount(DashboardManager);

  //     // Setting the `filters` data property
  //     wrapper.setData({ filters: { filterDate: { start: '2023-01-01' } } });

  //     expect(wrapper.vm.visualization).toEqual({
  //       filterDate: { start: '2023-01-01' },
  //     });
  //   });

  //   it('should watch visualization and update filters', async () => {
  //     const wrapper = mount(DashboardManager);

  //     // Simulating the `visualization` watcher trigger
  //     wrapper.setData({ filters: { filterDate: { start: '2023-01-01' } } });

  //     // Wait for the watcher to trigger
  //     await wrapper.vm.$nextTick();

  //     expect(wrapper.emitted().historyFilter).toBeTruthy();
  //     expect(wrapper.emitted().historyFilter[0]).toEqual([
  //       { filterDate: { start: '2023-01-01' } },
  //     ]);
  //     expect(wrapper.vm.showData).toBe(true);
  //   });

  //   it('should call getSectors on created', async () => {
  //     const getSectorsMock = vi.spyOn(DashboardManager.methods, 'getSectors');
  //     mount(DashboardManager);

  //     expect(getSectorsMock).toHaveBeenCalled();
  //   });

  //   it('should set sectors data correctly from API', async () => {
  //     const wrapper = mount(DashboardManager);

  //     // Mocking the API response
  //     const sectorsData = [{ id: 1, name: 'Sector 1' }];
  //     vi.spyOn(Sector, 'list').mockResolvedValueOnce({ results: sectorsData });

  //     await wrapper.vm.getSectors();

  //     expect(wrapper.vm.sectors).toEqual(sectorsData);
  //   });

  //   it('should handle error when sectors API fails', async () => {
  //     const wrapper = mount(DashboardManager);

  //     // Mocking the API failure
  //     vi.spyOn(Sector, 'list').mockRejectedValueOnce(new Error('API error'));

  //     const consoleErrorSpy = vi
  //       .spyOn(console, 'error')
  //       .mockImplementation(() => {});

  //     await wrapper.vm.getSectors();

  //     expect(consoleErrorSpy).toHaveBeenCalledWith(
  //       'The sectors could not be loaded at this time.',
  //       expect.any(Error),
  //     );
  //   });

  //   it('should render DashboardFilters component with correct props', () => {
  //     const wrapper = mount(DashboardManager);

  //     const dashboardFilters = wrapper.findComponent({
  //       name: 'DashboardFilters',
  //     });
  //     expect(dashboardFilters.props().sectors).toEqual(wrapper.vm.sectors);
  //   });

  //   it('should emit correct event when history-filter is triggered', async () => {
  //     const wrapper = mount(DashboardManager);

  //     const historyMetricsBySector = wrapper.findComponent({
  //       name: 'HistoryMetricsBySector',
  //     });

  //     const filterEvent = { filterDate: { start: '2023-01-01' } };
  //     await historyMetricsBySector.vm.$emit('history-filter', filterEvent);

  //     expect(wrapper.emitted().historyFilter).toBeTruthy();
  //     expect(wrapper.emitted().historyFilter[0]).toEqual([filterEvent]);
  //   });
});
