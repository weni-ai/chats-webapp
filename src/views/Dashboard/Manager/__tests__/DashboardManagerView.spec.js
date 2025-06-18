import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTestingPinia } from '@pinia/testing';

import { useConfig } from '@/store/modules/config';
import { useDashboard } from '@/store/modules/dashboard';

import Sector from '@/services/api/resources/settings/sector';

import DashboardManager from '../index.vue';

import DashboardLayout from '@/layouts/DashboardLayout/index.vue';
import HomeSidebarLoading from '@/views/loadings/HomeSidebar.vue';
import ViewMode from '@/views/Dashboard/ViewMode/index.vue';

import DashboardFilters from '@/components/dashboard/Filters.vue';

import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics.vue';

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

const createWrapper = (routeParams = {}, initialState = {}) => {
  return mount(DashboardManager, {
    global: {
      mocks: {
        $route: {
          params: routeParams,
        },
        $router: {
          push: vi.fn(),
        },
        $t: (key) => key,
      },
      stubs: {
        ViewOptions: {
          template: '<div>ViewOptions</div>',
        },
        UnnnicIcon: {
          template: '<div>UnnnicIcon</div>',
        },
      },
      components: {
        DashboardLayout,
        HomeSidebarLoading,
        ViewMode,
        DashboardFilters,
        HistoryMetricsBySector,
      },
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            config: { project: { name: 'Test Project' } },
            dashboard: {
              viewedAgent: { email: '', name: '' },
              isLoadingViewedAgent: false,
              ...initialState.dashboard,
            },
            ...initialState,
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
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      wrapper = createWrapper();
      configStore = useConfig();
      dashboardStore = useDashboard();
    });

    it('should render the DashboardLayout component when viewedAgent does not have email and not in view mode', async () => {
      dashboardStore.viewedAgent.email = '';
      wrapper.vm.isViewMode = false;
      await wrapper.vm.$nextTick();

      const dashboardLayout = wrapper.findComponent({
        name: 'DashboardLayout',
      });
      expect(dashboardLayout.exists()).toBe(true);
      expect(dashboardLayout.isVisible()).toBe(true);
    });

    it('should render the ViewMode component when viewedAgent has email and in view mode', async () => {
      dashboardStore.viewedAgent.email = 'test@domain.com';
      wrapper.vm.isViewMode = true;
      await wrapper.vm.$nextTick();

      const viewMode = wrapper.findComponent({ name: 'ViewMode' });
      expect(viewMode.exists()).toBe(true);
      expect(viewMode.isVisible()).toBe(true);
    });

    it('should render HomeSidebarLoading when isLoadingViewedAgent is true', async () => {
      wrapper = createWrapper(
        {},
        {
          dashboard: { isLoadingViewedAgent: true },
        },
      );
      dashboardStore = useDashboard();
      await wrapper.vm.$nextTick();

      const loading = wrapper.findComponent({ name: 'HomeSidebarLoading' });
      expect(loading.exists()).toBe(true);
      expect(loading.isVisible()).toBe(true);
    });

    it('should not render HomeSidebarLoading when isLoadingViewedAgent is false', async () => {
      wrapper = createWrapper(
        {},
        {
          dashboard: { isLoadingViewedAgent: false },
        },
      );
      dashboardStore = useDashboard();
      await wrapper.vm.$nextTick();

      const loading = wrapper.findComponent({ name: 'HomeSidebarLoading' });
      expect(loading.exists()).toBe(false);
    });
  });

  describe('Route Watching', () => {
    it('should call getViewedAgentData and set view mode when route param has viewedAgent', async () => {
      wrapper = createWrapper({ viewedAgent: 'test@example.com' });
      dashboardStore = useDashboard();

      expect(dashboardStore.getViewedAgentData).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(wrapper.vm.isViewMode).toBe(true);
    });

    it('should set view mode to false and reset viewedAgent when route param is empty', async () => {
      wrapper = createWrapper({ viewedAgent: 'test@example.com' });
      dashboardStore = useDashboard();

      expect(wrapper.vm.isViewMode).toBe(true);

      wrapper.vm.$options.watch['$route.params.viewedAgent'].handler.call(
        wrapper.vm,
        undefined,
      );
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isViewMode).toBe(false);
      expect(dashboardStore.setViewedAgent).toHaveBeenCalledWith({
        name: '',
        email: '',
      });
    });

    it('should handle route param change from one agent to another', async () => {
      wrapper = createWrapper({ viewedAgent: 'agent1@example.com' });
      dashboardStore = useDashboard();

      vi.clearAllMocks();

      wrapper.vm.$options.watch['$route.params.viewedAgent'].handler.call(
        wrapper.vm,
        'agent2@example.com',
      );
      await wrapper.vm.$nextTick();

      expect(dashboardStore.getViewedAgentData).toHaveBeenCalledWith(
        'agent2@example.com',
      );
      expect(wrapper.vm.isViewMode).toBe(true);
    });
  });

  describe('Component State Management', () => {
    beforeEach(() => {
      wrapper = createWrapper();
      configStore = useConfig();
      dashboardStore = useDashboard();
    });

    it('should display correct header from project name', () => {
      configStore.project.name = 'My Test Project';
      expect(wrapper.vm.header).toBe('My Test Project');
    });

    it('should initialize with correct default data', () => {
      expect(wrapper.vm.showData).toBe(false);
      expect(wrapper.vm.agents).toEqual({});
      expect(wrapper.vm.filters).toEqual({
        sector: '',
        agent: undefined,
        tags: undefined,
        filterDate: {
          start: null,
          end: null,
        },
      });
      expect(wrapper.vm.sectors).toEqual([]);
      expect(wrapper.vm.isViewMode).toBe(false);
    });

    it('should call getSectors on component creation', () => {
      expect(Sector.list).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  describe('Watch Behavior', () => {
    beforeEach(() => {
      wrapper = createWrapper();
      dashboardStore = useDashboard();
    });

    it('should update showData when visualization filter changes', async () => {
      const newFilter = {
        filterDate: {
          start: '2023-01-01',
          end: '2023-01-31',
        },
      };

      wrapper.vm.filters = newFilter;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showData).toBe(true);
    });
  });
});
