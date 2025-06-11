<template>
  <main
    class="general-dashboard"
    data-testid="general-dashboard"
  >
    <GeneralMetrics
      :metrics="generalMetrics"
      :rawData="rawInfo"
      :generalLabel="generalCardLabel"
      class="grid-1"
      data-testid="general-metrics"
    />
    <CardGroupMetrics
      :metrics="sectors"
      :title="headerTitle"
      icon="hierarchy-3-2"
      class="grid-2"
      data-testid="card-group-metrics"
    />
    <TableMetrics
      :headers="agentsLabel"
      :items="agents.project_agents"
      rawData="rawInfo"
      :title="$t('agents_online')"
      icon="indicator"
      class="grid-3"
      data-testid="table-metrics"
    />
  </main>
</template>

<script>
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';
import CardGroupMetrics from '../../CardGroupMetrics.vue';
import GeneralMetrics from '../../GeneralMetrics.vue';
import TableMetrics from '../../TableMetrics.vue';

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

  data() {
    return {
      agents: {},
      generalMetrics: {},
      sectors: {},
      rawInfo: {},
      tableHeaders: [
        {
          text: this.$t('agent'),
          value: 'name',
        },
        {
          text: this.$t('active_chats'),
          value: 'chats',
        },
      ],
    };
  },

  mounted() {
    this.roomInfo();
    this.agentInfo();
    this.sectorInfo();
    this.rawDataInfo();
  },

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
