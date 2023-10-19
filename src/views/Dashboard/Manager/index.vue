<template>
  <dashboard-layout>
    <template #header> {{ header }}</template>
    <template v-if="!this.showData" #status>
      <div style="margin-right: 27px">
        <span class="card-status">
          <unnnic-icon icon="indicator" scheme="feedback-green" style="margin-right: 12px" />
          <span>Ao vivo</span>
        </span>
      </div>
    </template>

    <template #actions>
      <dashboard-filters @filter="filters = $event" />
    </template>
    <template>
      <general-live-metrics
        v-if="this.filters.type === 'todos'"
        :headerTitle="this.filters.sectorUuid ? 'Filas' : 'Setores'"
        :totalChatsLabel="this.showData ? 'Quantidade de chats' : 'Agentes online'"
        :generalCardLabel="this.showData ? 'Quantidade de chats' : 'Em andamento'"
        :agentsLabel="this.showData ? 'Chats no período' : 'Em andamento'"
      />
      <!-- <live-metrics-by-agent v-if="visualization.category === 'agent'" /> -->
      <!-- <live-metrics-by-sector v-if="this.filters.type === 'sector'" /> -->
    </template>
    <template>
      <!-- <history-metrics-by-agent v-if="visualization.category === 'agent'" :agentName="header" /> -->
      <history-metrics-by-sector
        v-if="this.filters.type === 'sector'"
        :filter="this.filters"
        @historyFilter="event = $event"
        :headerTitle="this.filters.sectorUuid ? 'Filas' : 'Setores'"
        :totalChatsLabel="this.showData ? 'Quantidade de chats' : 'Agentes online'"
        :generalCardLabel="this.showData ? 'Quantidade de chats' : 'Em andamento'"
        :agentsLabel="this.showData ? 'Chats no período' : 'Em andamento'"
      />
    </template>
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';

import DashboardFilters from '@/components/dashboard/Filters';
// import LiveMetricsByAgent from '@/components/dashboard/metrics/ByAgent/LiveMetrics';
// import LiveMetricsBySector from '@/components/dashboard/metrics/BySector/LiveMetrics';
import GeneralLiveMetrics from '@/components/dashboard/metrics/General/LiveMetrics';
// import HistoryMetricsByAgent from '@/components/dashboard/metrics/ByAgent/HistoryMetrics';
import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics';
import ProjectApi from '@/services/api/resources/settings/project';

export default {
  name: 'DashboardManager',

  components: {
    DashboardFilters,
    // LiveMetricsByAgent,
    // LiveMetricsBySector,
    DashboardLayout,
    GeneralLiveMetrics,
    // HistoryMetricsByAgent,
    HistoryMetricsBySector,
  },

  data: () => ({
    showData: '',
    agents: {},
    project: [],
    filters: {
      type: 'todos',
    },
  }),

  mounted() {
    this.projectInfo();
  },

  methods: {
    async projectInfo() {
      const project = await ProjectApi.getInfo();
      this.project = project.data;
    },
  },
  watch: {
    visualization(newValue) {
      if (newValue) {
        this.filters = newValue;
        this.$emit('historyFilter', newValue);
        this.showData = !!this.filters.filteredDateRange.start;
      }
    },
  },
  computed: {
    visualization() {
      const filter = this.filters;
      if (filter.type === 'todos') return {};
      return filter;
    },

    header() {
      const projectName = this.project.name;
      return projectName;
    },
  },
};
</script>
<style lang="scss" scoped>
.card-status {
  display: flex;
  align-items: center;
  padding: 12px;
  color: $unnnic-color-neutral-dark;
  font-size: $unnnic-font-size-body-gt;
  width: 111px;
  height: 48px;
  background: #ffffff;
  border-radius: 4px;
}
</style>
