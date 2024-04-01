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
      <DashboardFilters @filter="filters = $event" />
    </template>

    <HistoryMetricsBySector
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
import DashboardLayout from '@/layouts/DashboardLayout';

import DashboardFilters from '@/components/dashboard/Filters';
import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics';
import ProjectApi from '@/services/api/resources/settings/project';

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
    project: [],
    filters: null,
  }),

  mounted() {
    this.projectInfo();
  },

  methods: {
    async projectInfo() {
      const project = await ProjectApi.getInfo();
      this.project = project.data;
    },
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
    visualization() {
      const filter = this.filters;
      return filter;
    },

    header() {
      const projectName = this.project.name;
      return projectName;
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
