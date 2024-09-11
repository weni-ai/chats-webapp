<template>
  <ViewMode v-show="viewedAgent?.email" />

  <DashboardLayout v-show="!viewedAgent?.email">
    <template #header> {{ header }}</template>
    <template
      v-if="!showData"
      #status
    >
      <div style="margin-right: 27px">
        <span class="card-status">
          <UnnnicIcon
            icon="indicator"
            scheme="feedback-green"
            style="margin-right: 12px"
          />
          <span>{{ $t('live') }}</span>
        </span>
      </div>
    </template>

    <template #actions>
      <DashboardFilters
        :sectors="sectors"
        @filter="filters = $event"
      />
    </template>

    <!-- <HistoryMetricsBySector
      :sectors="sectors"
      :filter="filters"
      :headerTitle="filters?.sector ? $t('queues.title') : $t('sectors')"
      :totalChatsLabel="showData ? $t('number_chats') : $t('agents_online')"
      :generalCardLabel="showData ? $t('number_chats') : $t('in_progress')"
      :agentsLabel="showData ? $t('chats_in_the_period') : $t('in_progress')"
      @history-filter="event = $event"
    /> -->
  </DashboardLayout>
</template>

<script>
import { mapState } from 'pinia';
import { useConfig } from '@/store/modules/config';
import { useDashboard } from '@/store/modules/dashboard';

import Sector from '@/services/api/resources/settings/sector';

import DashboardLayout from '@/layouts/DashboardLayout/index.vue';

import ViewMode from '@/views/Dashboard/ViewMode/index.vue';

import DashboardFilters from '@/components/dashboard/Filters.vue';
// import HistoryMetricsBySector from '@/components/dashboard/metrics/BySector/HistoryMetrics.vue';

export default {
  name: 'DashboardManager',

  components: {
    DashboardFilters,
    DashboardLayout,
    // HistoryMetricsBySector,
    ViewMode,
  },
  emits: ['historyFilter'],

  data: () => ({
    showData: '',
    agents: {},
    filters: null,
    sectors: [],
  }),
  computed: {
    ...mapState(useConfig, ['project']),
    ...mapState(useDashboard, ['viewedAgent']),

    visualization() {
      const filter = this.filters;
      return filter;
    },

    header() {
      const projectName = this.project.name;
      return projectName;
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

  async created() {
    await this.getSectors();
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
