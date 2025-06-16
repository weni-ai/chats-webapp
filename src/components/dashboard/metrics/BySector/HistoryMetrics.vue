<template>
  <main
    class="history-metrics"
    data-testid="history-metrics-dashboard"
  >
    <GeneralMetrics
      :metrics="generalMetrics"
      :rawData="rawInfo"
      :generalLabel="generalCardLabel"
      class="grid-1"
      data-testid="general-metrics"
    />
    <CardGroupMetrics
      :metrics="treatedSectors"
      :rawData="rawInfo"
      :title="headerTitle"
      :totalChatsLabel="totalChatsLabel"
      icon="hierarchy-3-2"
      class="grid-2"
      :allMetrics="headerTitle === $t('sectors')"
      data-testid="card-group-metrics"
    />
    <TableMetrics
      :headers="agentsLabel"
      :items="agents"
      :title="$t('chats_per_agents')"
      icon="indicator"
      class="grid-3"
      data-testid="table-metrics"
    />
  </main>
</template>

<script>
import { mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';

import env from '@/utils/env';

import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';

import CardGroupMetrics from '../../CardGroupMetrics.vue';
import GeneralMetrics from '../../GeneralMetrics.vue';
import TableMetrics from '../../TableMetrics.vue';

export default {
  name: 'HistoryMetricsBySector',

  components: {
    CardGroupMetrics,
    GeneralMetrics,
    TableMetrics,
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
    sectors: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      agents: {},
      generalMetrics: {},
      treatedSectors: {},
      rawInfo: {},
      tableHeaders: [
        {
          text: this.$t('agent'),
          value: 'name',
        },
        {
          text: this.$t('chats_in_the_period'),
          value: 'chats',
        },
      ],
      metricsTimer: null,
    };
  },

  computed: {
    updateFilter() {
      return this.filter;
    },
    ...mapState(useConfig, {
      project: 'project',
    }),
  },

  watch: {
    updateFilter(newValue) {
      if (newValue) {
        this.agentInfo();
        this.requestMetrics();

        const PROJECT_DASHBOARD_TIMER_REFRESH = env(
          'CHATS_PROJECTS_DASHBOARD_TIMER_REFRESH',
        )?.split(', ');
        const isTimerMetricsRefreshEnabled =
          PROJECT_DASHBOARD_TIMER_REFRESH?.includes(this.project?.uuid);

        if (isTimerMetricsRefreshEnabled) {
          this.startMetricsTimer();
        }
      }
    },
  },

  mounted() {
    this.requestMetrics();
    this.agentInfo();
  },

  methods: {
    orderAgents(agents) {
      const onlineAgents = agents.filter(
        (agent) => agent.agent_status === 'ONLINE',
      );
      const offlineAgents = agents.filter(
        (agent) => agent.agent_status === 'OFFLINE',
      );

      onlineAgents.sort((a, b) => a.first_name.localeCompare(b.first_name));
      offlineAgents.sort((a, b) => a.first_name.localeCompare(b.first_name));

      return onlineAgents.concat(offlineAgents);
    },

    async agentInfo() {
      try {
        const response = await DashboardManagerApi.getAgentInfo(
          this.filter.sector,
          this.filter.agent,
          this.filter.tags,
          this.filter.filterDate.start,
          this.filter.filterDate.end,
        );
        this.agents = this.orderAgents(response.project_agents);
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

    async fetchSectorData(sector) {
      const rawData = await this.rawDataInfo(sector.uuid);
      return { ...sector, ...rawData?.raw_data[0] };
    },

    async sectorInfo() {
      try {
        const response = await DashboardManagerApi.getSectorInfo(
          this.filter.sector,
          this.filter.agent,
          this.filter.tags,
          this.filter.filterDate.start,
          this.filter.filterDate.end,
        );

        if (this.headerTitle === 'Filas') {
          this.treatedSectors = response;
          return;
        }

        const newSectors = {
          sectors: await Promise.all(this.sectors?.map(this.fetchSectorData)),
        };

        newSectors.sectors = newSectors.sectors.map((sector) => {
          const equivalentResponseSector = response.sectors.find(
            (responseSector) => responseSector.uuid === sector.uuid,
          );
          return { ...sector, ...equivalentResponseSector };
        });

        this.treatedSectors = newSectors;
      } catch (error) {
        console.log(error);
      }
    },
    async rawDataInfo(sector) {
      try {
        const response = await DashboardManagerApi.getRawInfo(
          this.filter.sector || sector,
          this.filter.agent,
          this.filter.tags,
          this.filter.filterDate.start,
          this.filter.filterDate.end,
        );

        if (sector) {
          return response;
        }

        this.rawInfo = response;
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

    startMetricsTimer() {
      if (this.metricsTimer) {
        clearInterval(this.metricsTimer);
      }

      const ONE_MINUTE = 1000 * 60 * 1;
      this.metricsTimer = setInterval(() => this.requestMetrics(), ONE_MINUTE);
    },

    requestMetrics() {
      this.roomInfo();
      this.sectorInfo();
      this.rawDataInfo();
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
