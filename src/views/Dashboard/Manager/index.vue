<template>
  <dashboard-layout :filters.sync="filters">
    <template #header> {{ header }} </template>

    <general-live-metrics v-if="activeDashboard === 'general'" />
    <live-metrics-by-agent v-if="activeDashboard === 'by-agent'" />
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';

import LiveMetricsByAgent from './metrics/ByAgent/LiveMetrics';
import GeneralLiveMetrics from './metrics/General/LiveMetrics';

export default {
  name: 'DashboardManager',

  components: {
    LiveMetricsByAgent,
    DashboardLayout,
    GeneralLiveMetrics,
  },

  data: () => ({
    filters: {
      tab: '',
      visualization: '',
      date: '',
    },
  }),

  computed: {
    activeDashboard() {
      return this.filters.visualization === 'Juliano' ? 'by-agent' : 'general';
    },
    header() {
      return this.activeDashboard === 'by-agent' ? 'Juliano' : 'Construtora Stéfani';
    },
  },
};
</script>
