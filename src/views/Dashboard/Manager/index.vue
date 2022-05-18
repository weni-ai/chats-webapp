<template>
  <dashboard-layout :filters.sync="filters">
    <template #header> {{ header }} </template>

    <manager-general-dashboard v-if="activeDashboard === 'general'" />
    <by-user-dashboard v-if="activeDashboard === 'by-agent'" />
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';

import ByUserDashboard from './components/ByUserDashboard';
import ManagerGeneralDashboard from './components/GeneralDashboard';

export default {
  name: 'DashboardManager',

  components: {
    ByUserDashboard,
    DashboardLayout,
    ManagerGeneralDashboard,
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
