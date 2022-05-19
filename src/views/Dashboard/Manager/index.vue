<template>
  <dashboard-layout @filter="filters = $event">
    <template #header> {{ header }} </template>

    <general-live-metrics v-if="!visualization.category" />
    <live-metrics-by-agent v-if="visualization.category === 'agent'" />
    <live-metrics-by-sector v-if="visualization.category === 'sector'" />
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';

import LiveMetricsByAgent from './metrics/ByAgent/LiveMetrics';
import LiveMetricsBySector from './metrics/BySector/LiveMetrics';
import GeneralLiveMetrics from './metrics/General/LiveMetrics';

export default {
  name: 'DashboardManager',

  components: {
    LiveMetricsByAgent,
    LiveMetricsBySector,
    DashboardLayout,
    GeneralLiveMetrics,
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
    visualization() {
      return this.filters.visualization;
    },
    header() {
      return this.visualization.value ? this.visualization.text : 'Construtora Stéfani';
    },
  },
};
</script>
