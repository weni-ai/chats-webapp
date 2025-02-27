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
});
