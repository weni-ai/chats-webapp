<template>
  <main>
    <section>
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
        <div style="width: 66%">
          <general-metrics
            :metrics="generalMetrics"
            :rawData="rawInfo"
            :generalLabel="generalCardLabel"
          />
        </div>
        <div style="width: 33%">
          <table-metrics
            :headers="agentsLabel"
            :items="this.agents.project_agents"
            title="Chats por agente"
            icon="indicator"
          />
        </div>
      </div>
    </section>

    <section class="general-dashboard__metrics">
      <card-group-metrics :metrics="sectors" :title="headerTitle" icon="hierarchy-3-2" />
    </section>
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
        console.log(this.rawInfo, 'adada');
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.general-dashboard {
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
