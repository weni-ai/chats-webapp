<template>
  <dashboard-layout>
    <template #header> {{ header }} </template>

    <template #actions>
      <dashboard-filters @filter="filters = $event" v-bind="{ tags, visualizations, dates }" />
    </template>

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

import DashboardFilters from '../components/Filters';
import LiveMetricsByAgent from '../components/metrics/ByAgent/LiveMetrics';
import LiveMetricsBySector from '../components/metrics/BySector/LiveMetrics';
import GeneralLiveMetrics from '../components/metrics/General/LiveMetrics';
import HistoryMetricsByAgent from '../components/metrics/ByAgent/HistoryMetrics';
import HistoryMetricsBySector from '../components/metrics/BySector/HistoryMetrics';

export default {
  name: 'DashboardManager',

  components: {
    DashboardFilters,
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
        text: 'Geral',
        value: 'general',
        category: '',
      },
      date: '',
    },
    tags: [
      { text: 'Dúvidas', value: 'doubts' },
      { text: 'Financeiro', value: 'finance' },
      { text: 'Ajuda', value: 'help' },
    ],
    visualizations: [
      { text: 'Geral', value: 'general', type: 'option' },
      { type: 'category', text: 'Departamentos' },
      { text: 'Financeiro', value: 'finance', type: 'option', category: 'sector' },
      { text: 'Suporte', value: 'support', type: 'option', category: 'sector' },
      { type: 'category', text: 'Agentes' },
      { text: 'Juliano', value: 'juliano', type: 'option', category: 'agent' },
    ],
    dates: [
      { value: '', text: 'Agora' },
      { value: 'last-7-days', text: 'Últimos 7 dias' },
      { value: 'last-14-days', text: 'Últimos 14 dias' },
      { value: 'last-30-days', text: 'Últimos 30 dias' },
      { value: 'last-12-months', text: 'Últimos 12 meses' },
      { value: 'current-month', text: 'Mês Atual' },
      { value: 'all', text: 'Desde o início' },
    ],
  }),

  computed: {
    isLiveView() {
      return !this.filters.date;
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
      return this.visualization.value ? this.visualization.text : 'Construtora Stéfani';
    },
  },
};
</script>
