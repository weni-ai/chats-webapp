<template>
  <dashboard-layout>
    <template #header> {{ agent.name }} </template>

    <template #actions>
      <dashboard-filters @filter="filters = $event" v-bind="{ tags, dates }" />
    </template>

    <history-metrics-by-agent :agentName="agent.name" />
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardFilters from '../components/Filters';
import HistoryMetricsByAgent from '../Manager/metrics/ByAgent/HistoryMetrics';

export default {
  name: 'DashboardManager',

  components: {
    DashboardFilters,
    DashboardLayout,
    HistoryMetricsByAgent,
  },

  data: () => ({
    agent: {
      name: 'Juliano',
    },
    filters: {
      tab: '',
      date: '',
    },
    tags: [
      { text: 'Dúvidas', value: 'doubts' },
      { text: 'Financeiro', value: 'finance' },
      { text: 'Ajuda', value: 'help' },
    ],
    dates: [
      { value: '', text: 'Mês Atual' },
      { value: 'last-7-days', text: 'Últimos 7 dias' },
      { value: 'last-14-days', text: 'Últimos 14 dias' },
      { value: 'last-30-days', text: 'Últimos 30 dias' },
      { value: 'last-12-months', text: 'Últimos 12 meses' },
      { value: 'all', text: 'Desde o início' },
    ],
  }),
};
</script>
