<template>
  <DashboardLayout>
    <template #header> {{ agent.name }} </template>

    <template #actions>
      <DashboardFilters
        :tags="tags"
        @filter="filters = $event"
      />
    </template>

    <HistoryMetricsByAgent :agentName="agent.name" />
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout/index.vue';
import DashboardFilters from '@/components/dashboard/Filters.vue';
import HistoryMetricsByAgent from '@/components/dashboard/metrics/ByAgent/HistoryMetrics.vue';
import DashboardAgent from '@/services/api/resources/dashboard/dashboardAgent';

import i18n from '@/plugins/i18n';

export default {
  name: 'DashboardAgent',

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
      { text: i18n.global.t('doubts'), value: 'doubts' },
      { text: i18n.global.t('finance'), value: 'finance' },
      { text: i18n.global.t('help.label'), value: 'help' },
    ],
  }),

  mounted() {
    this.agentInfo();
  },

  methods: {
    async agentInfo() {
      const agent = await DashboardAgent.getAgentInfo();
      this.info = agent.results;
      // console.log(this.info, `agent`);
    },
  },
};
</script>
