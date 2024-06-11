<template>
  <DashboardLayout>
    <template #header> {{ header }}</template>
    <template
      v-if="!this.showData"
      #status
    >
      <div style="margin-right: 27px">
        <span class="card-status">
          <UnnnicIcon
            icon="indicator"
            scheme="feedback-green"
            style="margin-right: 12px"
          />
          <span>Ao vivo</span>
        </span>
      </div>
    </template>

    <template #actions>
      <DashboardFilters
        @filter="filters = $event"
        :sectors="sectors"
      />
    </template>

    <HistoryMetricsBySector
      :sectors="sectors"
      :filter="filters"
      @historyFilter="event = $event"
      :headerTitle="filters?.sector ? 'Filas' : 'Setores'"
      :totalChatsLabel="showData ? 'Quantidade de chats' : 'Agentes online'"
      :generalCardLabel="showData ? 'Quantidade de chats' : 'Em andamento'"
      :agentsLabel="showData ? 'Chats no período' : 'Em andamento'"
    />
  </DashboardLayout>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import { mapState } from 'pinia';

import DashboardLayout from '@/layouts/DashboardLayout';

import DashboardFilters from '@/components/dashboard/Filters';
import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics';

export default {
  name: 'DashboardManager',

  components: {
    DashboardFilters,
    DashboardLayout,
    HistoryMetricsBySector,
  },

  data: () => ({
    showData: '',
    agents: {},
    filters: null,
    sectors: [],
  }),

  async created() {
    await this.getSectors();
  },

  watch: {
    visualization(newValue) {
      if (newValue) {
        this.filters = newValue;
        this.$emit('historyFilter', newValue);
        this.showData = !!this.filters?.filterDate.start;
      }
    },
  },
  computed: {
    ...mapState({
      project: (state) => state.config.project,
    }),
    visualization() {
      const filter = this.filters;
      return filter;
    },

    header() {
      const projectName = this.project.name;
      return projectName;
    },
  },

  methods: {
    async getSectors() {
      try {
        const { results } = await Sector.list({ limit: 50 });
        this.sectors = results;
      } catch (error) {
        console.error('The sectors could not be loaded at this time.', error);
      }
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
