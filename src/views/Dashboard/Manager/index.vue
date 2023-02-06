<template>
  <dashboard-layout>
    <template #header> {{ header }}</template>

    <template #actions>
      <dashboard-filters @filter="filters = $event" />
    </template>
    <template>
      <general-live-metrics v-if="this.filters.type === 'todos'" />
      <!-- <live-metrics-by-agent v-if="visualization.category === 'agent'" /> -->
      <!-- <live-metrics-by-sector v-if="this.filters.type === 'sector'" /> -->
    </template>

    <template>
      <!-- <history-metrics-by-agent v-if="visualization.category === 'agent'" :agentName="header" /> -->
      <history-metrics-by-sector
        v-if="this.filters.type === 'sector'"
        :filter="this.filters"
        @historyFilter="atencao = $event"
      />
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
import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics';
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
    HistoryMetricsBySector,
  },

  data: () => ({
    agents: {},
    project: [],
    filters: {
      type: 'todos',
    },
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
  watch: {
    visualization(newValue) {
      if (newValue) {
        this.filters = newValue;
        this.$emit('historyFilter', newValue);
      }
    },
  },
  computed: {
    visualization() {
      const filter = this.filters;
      if (filter.type === 'todos') return {};
      return filter;
    },

    header() {
      const projectName = this.project.name;
      return projectName;
    },
  },
};
</script>
