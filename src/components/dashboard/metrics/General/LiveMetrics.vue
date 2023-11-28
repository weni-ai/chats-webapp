<template>
  <main class="general-dashboard">
    <general-metrics
      :metrics="generalMetrics"
      :rawData="rawInfo"
      :generalLabel="generalCardLabel"
      class="grid-1"
    />
    <card-group-metrics
      :metrics="sectors"
      :title="headerTitle"
      icon="hierarchy-3-2"
      class="grid-2"
    />
    <table-metrics
      :headers="agentsLabel"
      :items="this.agents.project_agents"
      rawData="rawInfo"
      title="Agentes online"
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
  name: 'GeneralLiveMetrics',

  components: {
    CardGroupMetrics,
    GeneralMetrics,
    TableMetrics,
  },

  props: {
    headerTitle: {
      type: String,
      default: '',
    },
    generalCardLabel: {
      type: String,
      default: '',
    },
  },

  mounted() {
    this.roomInfo();
    this.agentInfo();
    this.sectorInfo();
    this.rawDataInfo();
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
        text: 'Chats ativos',
        value: 'chats',
      },
    ],
  }),

  methods: {
    async agentInfo() {
      try {
        this.agents = await DashboardManagerApi.getAgentInfo();
      } catch (error) {
        console.log(error);
      }
    },

    async roomInfo() {
      try {
        this.generalMetrics = await DashboardManagerApi.getRoomInfo();
      } catch (error) {
        console.log(error);
      }
    },

    async sectorInfo() {
      try {
        this.sectors = await DashboardManagerApi.getSectorInfo();
      } catch (error) {
        console.log(error);
      }
    },
    async rawDataInfo() {
      try {
        this.rawInfo = await DashboardManagerApi.getRawInfo();
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.general-dashboard {
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
</style>
