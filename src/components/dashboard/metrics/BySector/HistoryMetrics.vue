<template>
  <main class="history-sector-metrics">
    <section>
      <general-metrics :metrics="generalMetrics" />
    </section>

    <section class="history-sector-metrics__metrics">
      <card-group-metrics :metrics="sectors" title="Filas" icon="hierarchy-3-2" />
      <table-metrics
        :items="this.agents.project_agents"
        title="Chats por agente"
        icon="indicator"
      />
    </section>
  </main>
</template>

<script>
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';
import CardGroupMetrics from '../../CardGroupMetrics';
import GeneralMetrics from '../../GeneralMetrics';
// import TableMetrics from '../../TableMetrics';

export default {
  name: 'HistoryMetricsBySector',

  components: {
    CardGroupMetrics,
    GeneralMetrics,
    // TableMetrics,
  },

  mounted() {
    this.agentInfo();
    this.roomInfo();
    this.sectorInfo();
  },

  props: {
    filter: {
      type: Object,
      default: () => {},
    },
  },

  data: () => ({
    agents: {},
    generalMetrics: {},
    sectors: {},
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
      }
    },
  },

  methods: {
    async agentInfo() {
      const temTag = ![null, undefined, ''].includes(this.filter.tag);
      if (temTag) {
        this.nameTag = this.filter.tag.map((el) => el.text).toString();
      } else {
        this.nameTag = this.filter.tag;
      }
      try {
        this.agents = await DashboardManagerApi.getAgentInfo(
          this.filter.sectorUuid,
          this.nameTag,
          this.filter.start,
          this.filter.end,
        );
      } catch (error) {
        console.log(error);
      }
    },

    async roomInfo() {
      const temTag = ![null, undefined, ''].includes(this.filter.tag);
      if (temTag) {
        this.nameTag = this.filter.tag.map((el) => el.text).toString();
      } else {
        this.nameTag = this.filter.tag;
      }
      try {
        this.generalMetrics = await DashboardManagerApi.getRoomInfo(
          this.filter.sectorUuid,
          this.nameTag,
          this.filter.start,
          this.filter.end,
        );
      } catch (error) {
        console.log(error);
      }
    },

    async sectorInfo() {
      const temTag = ![null, undefined, ''].includes(this.filter.tag);
      if (temTag) {
        this.nameTag = this.filter.tag.map((el) => el.text).toString();
      } else {
        this.nameTag = this.filter.tag;
      }
      try {
        this.sectors = await DashboardManagerApi.getSectorInfo(
          this.filter.sectorUuid,
          this.nameTag,
          this.filter.start,
          this.filter.end,
        );
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
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
