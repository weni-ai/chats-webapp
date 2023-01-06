<template>
  <main class="general-dashboard">
    <section>
      <general-metrics :metrics="generalMetrics" />
    </section>

    <section class="general-dashboard__metrics">
      <card-group-metrics :metrics="sectors" title="Setores" icon="hierarchy-3-2" />
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

  mounted() {
    this.roomInfo();
    this.agentInfo();
  },

  destroyed() {
    clearInterval(this.realtimeSimulationController);
  },

  data: () => ({
    agents: {},
    generalMetrics: [],
  }),

  computed: {
    sectors() {
      const { sectors } = this.$store.state.settings;

      return sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        statuses: this.getRandomMetrics(),
      }));
    },
  },

  methods: {
    async agentInfo() {
      this.agents = await DashboardManagerApi.getAgentInfo();
      console.log(this.agents.project_agents, `agents`);
    },

    async roomInfo() {
      try {
        this.generalMetrics = await DashboardManagerApi.getRoomInfo();
      } catch (error) {
        console.log(error);
      }
    },

    timeToString({ minutes, seconds }) {
      return `${minutes}min ${seconds}s`;
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
