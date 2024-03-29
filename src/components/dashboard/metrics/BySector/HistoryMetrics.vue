<template>
  <main class="history-metrics">
    <GeneralMetrics
      :metrics="generalMetrics"
      :rawData="rawInfo"
      :generalLabel="generalCardLabel"
      class="grid-1"
    />
    <CardGroupMetrics
      :metrics="sectors"
      :rawData="rawInfo"
      :title="headerTitle"
      :totalChatsLabel="totalChatsLabel"
      icon="hierarchy-3-2"
      class="grid-2"
    />
    <TableMetrics
      :headers="agentsLabel"
      :items="this.agents.project_agents"
      title="Chats por agente"
      icon="indicator"
      class="grid-3"
    />
  </main>
</template>

<script>
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';
import CardGroupMetrics from '../../CardGroupMetrics';
import GeneralMetrics from '../../GeneralMetrics';
import TableMetrics from '../../TableMetrics';

export default {
  name: 'HistoryMetricsBySector',

  components: {
    CardGroupMetrics,
    GeneralMetrics,
    TableMetrics,
  },

  mounted() {
    this.agentInfo();
    this.roomInfo();
    this.sectorInfo();
    this.rawDataInfo();
  },

  props: {
    filter: {
      type: Object,
      default: () => {},
    },
    headerTitle: {
      type: String,
      default: '',
    },
    agentsLabel: {
      type: String,
      default: '',
    },
    totalChatsLabel: {
      type: String,
      default: '',
    },
    generalCardLabel: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    agents: {},
    generalMetrics: {},
    sectors: {},
    rawInfo: {},
    tableHeaders: [
      {
        text: 'Agente',
        value: 'name',
      },
      {
        text: 'Chats no período',
        value: 'chats',
      },
    ],
  }),

  computed: {
    updateFilter() {
      return this.filter;
    },
  },

  watch: {
    updateFilter(newValue) {
      if (newValue) {
        this.agentInfo();
        this.roomInfo();
        this.sectorInfo();
        this.rawDataInfo();
      }
    },
  },

  methods: {
    async agentInfo() {
      try {
        this.agents = await DashboardManagerApi.getAgentInfo(
          this.filter.sector,
          this.filter.agent,
          this.filter.tags,
          this.filter.filterDate.start,
          this.filter.filterDate.end,
        );
      } catch (error) {
        console.log(error);
      }
    },

    async roomInfo() {
      try {
        this.generalMetrics = await DashboardManagerApi.getRoomInfo(
          this.filter.sector,
          this.filter.agent,
          this.filter.tags,
          this.filter.filterDate.start,
          this.filter.filterDate.end,
        );
      } catch (error) {
        console.log(error);
      }
    },

    async sectorInfo() {
      try {
        this.sectors = await DashboardManagerApi.getSectorInfo(
          this.filter.sector,
          this.filter.agent,
          this.filter.tags,
          this.filter.filterDate.start,
          this.filter.filterDate.end,
        );
      } catch (error) {
        console.log(error);
      }
    },
    async rawDataInfo() {
      try {
        this.rawInfo = await DashboardManagerApi.getRawInfo(
          this.filter.sector,
          this.filter.agent,
          this.filter.tags,
          this.filter.filterDate.start,
          this.filter.filterDate.end,
        );
      } catch (error) {
        console.log(error);
      }
    },
    async downloadDashboardData() {
      try {
        this.download = await DashboardManagerApi.downloadData(
          this.filter.sector,
          this.filter.agent,
          this.filter.tags,
          this.filter.filterDate.start,
          this.filter.filterDate.end,
        );
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.history-metrics {
  display: grid;
  grid-template-areas:
    'grid-1 grid-1 grid-3'
    'grid-2 grid-2 grid-3'
    '. . grid-3';
  gap: $unnnic-spacing-sm;

  .grid-1 {
    grid-area: grid-1;
  }
  .grid-2 {
    grid-area: grid-2;
  }
  .grid-3 {
    grid-area: grid-3;
  }
}
.history-sector-metrics {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-sm;

  &__metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-spacing-stack-sm;

    & > :first-child {
      grid-column: span 2;
    }
  }
}
</style>
