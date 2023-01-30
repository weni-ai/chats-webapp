<template>
  <dashboard-layout>
    <template #header> {{ agent.name }} </template>

    <template #actions>
      <dashboard-filters @filter="filters = $event" :tags="tags" />
    </template>

    <history-metrics-by-agent :agentName="agent.name" />
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardFilters from '@/components/dashboard/Filters';
import HistoryMetricsByAgent from '@/components/dashboard/metrics/ByAgent/HistoryMetrics';
import DashboardAgent from '@/services/api/resources/dashboard/dashboardAgent';

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
  }),

  mounted() {
    this.agentInfo();
  },

  methods: {
    async agentInfo() {
      const agent = await DashboardAgent.getAgentInfo();
      this.info = agent.results;
      console.log(this.info, `agent`);
    },
  },
};
</script>
