<template>
  <dashboard-layout :filters.sync="filters">
    <template #header> Construtora Stéfani </template>

    <manager-general-dashboard />
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';

import ManagerGeneralDashboard from './components/GeneralDashboard';

export default {
  name: 'DashboardManager',

  components: {
    DashboardLayout,
    ManagerGeneralDashboard,
  },

  data: () => ({
    filters: {},
  }),
};
</script>
