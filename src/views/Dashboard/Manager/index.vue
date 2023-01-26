<template>
  <dashboard-layout>
    <template #header> {{ header }} </template>

    <template #actions>
      <dashboard-filters @filter="filters = $event" v-bind="{ tags, visualizations }" />
    </template>

    <template v-if="isLiveView">
      <general-live-metrics v-if="!visualization.category" :agents="this.agents" />
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

import DashboardFilters from '@/components/dashboard/Filters';
import LiveMetricsByAgent from '@/components/dashboard/metrics/ByAgent/LiveMetrics';
import LiveMetricsBySector from '@/components/dashboard/metrics/BySector/LiveMetrics';
import GeneralLiveMetrics from '@/components/dashboard/metrics/General/LiveMetrics';
import HistoryMetricsByAgent from '@/components/dashboard/metrics/ByAgent/HistoryMetrics';
import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics';
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';

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
    agents: {},
    filters: {
      tab: '',
      visualization: {
        text: 'Geral',
        value: 'general',
        category: '',
      },
      date: {
        start: '',
        end: '',
      },
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
  }),

  mounted() {
    // this.roomInfo();
    this.sectorInfo();
    this.agentInfo();
  },

  methods: {
    // async roomInfo() {
    //   const managers = await DashboardManagerApi.getRoomInfo();
    //   this.info = managers.results;
    // },

    async agentInfo() {
      const agent = await DashboardManagerApi.getAgentInfo();
      this.agents = agent.results;
    },
    async sectorInfo() {
      const sector = await DashboardManagerApi.getSectorInfo();
      this.sectors = sector.results;
    },
  },

  computed: {
    isLiveView() {
      return !this.filters.date.start && !this.filters.date.end;
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
