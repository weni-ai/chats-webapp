<template>
  <main>
    <div style="width: 66%; margin-bottom: 16px">
      <section>
        <general-metrics
          :metrics="generalMetrics"
          :rawData="rawInfo"
          :generalLabel="generalCardLabel"
        />
      </section>
    </div>

    <section class="history-sector-metrics__metrics">
      <card-group-metrics
        :metrics="sectors"
        :rawData="rawInfo"
        :title="headerTitle"
        :totalChatsLabel="totalChatsLabel"
        icon="hierarchy-3-2"
      />
      <table-metrics
        :headers="agentsLabel"
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
      const temTag = ![null, undefined, ''].includes(this.filter.tag);
      if (temTag) {
        this.nameTag = this.filter.tag.map((el) => el.text).toString();
      } else {
        this.nameTag = this.filter.tag;
      }
      try {
        this.agents = await DashboardManagerApi.getAgentInfo(
          this.filter.sectorUuid,
          this.filter.agent,
          this.nameTag,
          this.filter.filteredDateRange.start,
          this.filter.filteredDateRange.end,
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
          this.filter.agent,
          this.nameTag,
          this.filter.filteredDateRange.start,
          this.filter.filteredDateRange.end,
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
          this.filter.agent,
          this.nameTag,
          this.filter.filteredDateRange.start,
          this.filter.filteredDateRange.end,
        );
      } catch (error) {
        console.log(error);
      }
    },
    async rawDataInfo() {
      const temTag = ![null, undefined, ''].includes(this.filter.tag);
      if (temTag) {
        this.nameTag = this.filter.tag.map((el) => el.text).toString();
      } else {
        this.nameTag = this.filter.tag;
      }
      try {
        this.rawInfo = await DashboardManagerApi.getRawInfo(
          this.filter.sectorUuid,
          this.filter.agent,
          this.nameTag,
          this.filter.filteredDateRange.start,
          this.filter.filteredDateRange.end,
        );
      } catch (error) {
        console.log(error);
      }
    },
    async downloadDashboardData() {
      const temTag = ![null, undefined, ''].includes(this.filter.tag);
      if (temTag) {
        this.nameTag = this.filter.tag.map((el) => el.text).toString();
      } else {
        this.nameTag = this.filter.tag;
      }
      try {
        this.download = await DashboardManagerApi.downloadData(
          this.filter.sectorUuid,
          this.filter.agent,
          this.nameTag,
          this.filter.filteredDateRange.start,
          this.filter.filteredDateRange.end,
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
