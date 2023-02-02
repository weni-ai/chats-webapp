<template>
  <dashboard-layout>
    <template #header> {{ header }}</template>

    <template #actions>
      <dashboard-filters @send-filter="filters" />
    </template>

    <template>
      <general-live-metrics :agents="this.agents" />
      <!-- <live-metrics-by-agent v-if="visualization.category === 'agent'" /> -->
      <!-- <live-metrics-by-sector v-if="visualization.category === 'sector'" /> -->
    </template>

    <template>
      <!-- <history-metrics-by-agent v-if="visualization.category === 'agent'" :agentName="header" />
      <history-metrics-by-sector v-if="visualization.category === 'sector'" /> -->
    </template>
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';

import DashboardFilters from '@/components/dashboard/Filters';
// import LiveMetricsByAgent from '@/components/dashboard/metrics/ByAgent/LiveMetrics';
// import LiveMetricsBySector from '@/components/dashboard/metrics/BySector/LiveMetrics';
import GeneralLiveMetrics from '@/components/dashboard/metrics/General/LiveMetrics';
// import HistoryMetricsByAgent from '@/components/dashboard/metrics/ByAgent/HistoryMetrics';
// import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics';
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';

export default {
  name: 'DashboardManager',

  components: {
    DashboardFilters,
    // LiveMetricsByAgent,
    // LiveMetricsBySector,
    DashboardLayout,
    GeneralLiveMetrics,
    // HistoryMetricsByAgent,
    // HistoryMetricsBySector,
  },

  data: () => ({
    agents: {},
    project: [],
    filters: [],
    sectorFilter: '',
  }),

  mounted() {
    this.projectInfo();
  },

  methods: {
    async projectInfo() {
      const project = await DashboardManagerApi.getProjectInfo();
      this.project = project.data;
    },
  },

  computed: {
    isLiveView() {
      return !this.filters.date.start && !this.filters.date.end;
    },

    filteredContacts() {
      return this.filters
        .filter(this.isRoomFromFilteredSector)
        .filter(this.contactHasAllActiveFilterTags)
        .filter(this.isRoomEndDateInFilteredRange);
    },
    visualization() {
      const { visualization } = this.filters;

      if (visualization.value === 'general') return {};

      const { text, value, category } = this.visualizations.find(
        (v) => v.value === visualization.value,
      );

      return {
        text,
        category,
        value,
      };
    },
    header() {
      const projectName = this.project.name;
      return projectName;
    },
  },
};
</script>
