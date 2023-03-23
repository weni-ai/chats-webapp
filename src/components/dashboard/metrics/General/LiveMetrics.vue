<template>
  <main class="general-dashboard">
    <section>
      <general-metrics :metrics="generalMetrics" :generalLabel="generalCardLabel" />
    </section>

    <section class="general-dashboard__metrics">
      <card-group-metrics :metrics="sectors" :title="headerTitle" icon="hierarchy-3-2" />
      <table-metrics
        :headers="tableHeaders"
        :items="this.agents.project_agents"
        title="Agentes online"
        icon="indicator"
      />
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
  },

  data: () => ({
    agents: {},
    generalMetrics: {},
    sectors: {},
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
