<template>
  <dashboard-layout @filter="filters = $event">
    <template #header> {{ header }} </template>

    <template v-if="isLiveView">
      <general-live-metrics v-if="!visualization.category" />
      <live-metrics-by-agent v-if="visualization.category === 'agent'" />
      <live-metrics-by-sector v-if="visualization.category === 'sector'" />
    </template>

    <template v-else>
      <history-metrics-by-agent v-if="visualization.category === 'agent'" :agentName="header" />
      <history-metrics-by-sector v-if="visualization.category === 'sector'" />
    </template>
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';

import LiveMetricsByAgent from './metrics/ByAgent/LiveMetrics';
import LiveMetricsBySector from './metrics/BySector/LiveMetrics';
import GeneralLiveMetrics from './metrics/General/LiveMetrics';
import HistoryMetricsByAgent from './metrics/ByAgent/HistoryMetrics';
import HistoryMetricsBySector from './metrics/BySector/HistoryMetrics';

export default {
  name: 'DashboardManager',

  components: {
    LiveMetricsByAgent,
    LiveMetricsBySector,
    DashboardLayout,
    GeneralLiveMetrics,
    HistoryMetricsByAgent,
    HistoryMetricsBySector,
  },

  data: () => ({
    filters: {
      tab: '',
      visualization: {
        text: '',
        value: '',
        category: '',
      },
      date: '',
    },
  }),

  computed: {
    isLiveView() {
      return !this.filters.date;
    },
    visualization() {
      return this.filters.visualization;
    },
    header() {
      return this.visualization.value ? this.visualization.text : 'Construtora Stéfani';
    },
  },
};
</script>
