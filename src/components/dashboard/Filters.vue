<template>
  <section class="dashboard-filters">
    <div class="dashboard-filters" style="z-index: 100">
      <unnnic-select
        style="min-width: 11.81rem; width: 18.65rem"
        v-model="filteredSectorUuid"
        label="Filtrar por setor"
        size="md"
        class="input"
        @input="
          getSectorTags(filteredSectorUuid),
            getSectorAgentes(filteredSectorUuid),
            sendFilter('sector', filteredSectorUuid)
        "
      >
        <option value="">Todos</option>
        <option
          v-for="sector in sectors"
          :key="sector.uuid"
          :value="sector.uuid"
          :selected="sector.uuid === filteredSectorUuid"
        >
          {{ sector.name }}
        </option>
      </unnnic-select>

      <unnnic-select
        style="min-width: 11.81rem; width: 18.65rem"
        v-if="filteredSectorUuid"
        v-model="filteredAgent"
        label="Filtrar por agente"
        size="md"
        class="input"
        @input="sendFilter('sector', filteredSectorUuid, filteredAgent)"
        searchPlaceholder="oi"
      >
        <option value="">Buscar por agente</option>
        <option
          v-for="agent in agents"
          :key="agent.email"
          :value="agent.email"
          :selected="agent.email === filteredAgent"
        >
          {{ agent.name }}
        </option>
      </unnnic-select>

      <unnnic-autocomplete-select
        style="min-width: 11.81rem; width: 18.65rem"
        v-model="selecteds"
        :items="tags"
        :placeholder="this.messageInputTags"
        :disabled="!this.filteredSectorUuid && sectors.length !== 1"
        @input="sendFilter('sector', filteredSectorUuid, filteredAgent, selecteds)"
      />

      <unnnic-input-date-picker
        style="min-width: 20px"
        :days="['D', 'S', 'T', 'Q', 'Q', 'S', 'S']"
        v-model="filteredDateRange"
        size="md"
        class="input"
        :input-format="$t('date_format')"
        position="right"
        :submit="
          sendFilter('sector', filteredSectorUuid, filteredAgent, selecteds, filteredDateRange)
        "
      />

      <unnnic-tool-tip enabled text="Limpar filtro" side="right">
        <unnnic-button-icon
          icon="button-refresh-arrows-1"
          size="large"
          class="clear-filters-btn"
          @click="clearFilters"
        />
      </unnnic-tool-tip>
    </div>
    <div>
      <!-- <unnnic-dropdown v-bind="$props">
        <unnnic-button-icon
          icon="navigation-menu-vertical-1"
          size="large"
          class="clear-filters-btn"
          slot="trigger"
        />
        <div class="attachment-options-container" style="width: 155px">
          <unnnic-dropdown-item class="option">
            <span
              class="upload-dropdown-option"
              @click="downloadMetric('metrics_csv')"
              @keypress.enter="downloadMetric('metrics_csv')"
            >
              <span> Exportar métricas em CSV </span>
            </span>
          </unnnic-dropdown-item>
          <unnnic-dropdown-item class="option">
            <span
              class="upload-dropdown-option"
              @click="downloadDashboardData('all_csv')"
              @keypress.enter="downloadDashboardData('all_csv')"
            >
              <span> Exportar tudo em CSV </span>
            </span>
          </unnnic-dropdown-item>
          <unnnic-dropdown-item class="option">
            <span
              class="upload-dropdown-option"
              @click="downloadMetric('metrics_xls')"
              @keypress.enter="downloadMetric('metrics_xls')"
            >
              <span> Exportar métricas em XLS </span>
            </span>
          </unnnic-dropdown-item>
          <unnnic-dropdown-item class="option">
            <span
              class="upload-dropdown-option"
              @click="downloadDashboardData('all_xls')"
              @keypress.enter="downloadDashboardData('all_xls')"
            >
              <span> Exportar tudo em XLS </span>
            </span>
          </unnnic-dropdown-item>
        </div>
      </unnnic-dropdown> -->
    </div>
  </section>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';

// const moment = require('moment');

export default {
  name: 'DashboardFilters',

  beforeMount() {
    if (this.tag) this.filteredTags.push(this.tag);
    if (this.agent) this.filteredAgentes.push(this.agent);
    this.getSectors();
  },

  props: {
    sectorFilter: {
      type: String,
      default: '',
    },
  },

  computed: {
    filteredTags() {
      if (this.selecteds.length === 0) return [];
      const group = this.selecteds;
      return group;
    },
  },

  data: () => ({
    filteredSectorUuid: '',
    filteredAgent: '',
    messageInputTags: 'Filtrar por tags',
    messageInputAgent: 'Filtrar por agente',
    sectors: [],
    sectorTags: [],
    tags: [],
    agents: [],
    selecteds: [],
    filteredDateRange: {
      start: null,
      end: null,
    },
  }),

  methods: {
    async downloadMetric(option) {
      const temTag = ![null, undefined, ''].includes(this.selecteds);
      if (temTag) {
        this.nameTag = this.selecteds.map((el) => el.text).toString();
      } else {
        this.nameTag = this.selecteds;
      }
      try {
        this.download = await DashboardManagerApi.downloadMetricData(
          this.filteredSectorUuid,
          this.filteredAgent,
          this.selecteds,
          this.filteredDateRange.start,
          this.filteredDateRange.end,
          option,
        );
      } catch (error) {
        console.log(error);
      }
    },
    async downloadDashboardData(option) {
      const temTag = ![null, undefined, ''].includes(this.selecteds);
      if (temTag) {
        this.nameTag = this.selecteds.map((el) => el.text).toString();
      } else {
        this.nameTag = this.selecteds;
      }
      try {
        this.download = await DashboardManagerApi.downloadAllData(
          this.filteredSectorUuid,
          this.filteredAgent,
          this.selecteds,
          this.filteredDateRange.start,
          this.filteredDateRange.end,
          option,
        );
      } catch (error) {
        console.log(error);
      }
    },

    sendFilter(type, filteredSectorUuid, agent, tag, filteredDateRange) {
      const filter = {
        type,
        sectorUuid: filteredSectorUuid,
        tag,
        agent,
        filteredDateRange,
      };
      this.$emit('filter', filter);
    },

    async getSectors() {
      try {
        this.isLoading = true;
        const response = await Sector.list();
        this.sectors = response.results;
        if (this.sectors.length === 1) {
          this.getSectorTags(this.sectors[0].uuid);
        }
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },

    async getSectorTags(sectorUuid) {
      if (!sectorUuid) {
        this.tags = [];
        return;
      }
      try {
        this.isLoading = true;
        const response = await Sector.tags(sectorUuid);
        const tags = response.results;

        const tagGroup = tags.map((tag) => ({ value: tag.uuid, text: tag.name }));
        this.tags = tagGroup;
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },
    async getSectorAgentes(uuid) {
      if (!uuid) {
        this.agents = [];
        return;
      }
      try {
        this.isLoading = true;
        const response = await Sector.agents({ sectorUuid: uuid });
        const agents = response.map(({ first_name, last_name, email }) => {
          return {
            name: [first_name, last_name].join(' ').trim() || email,
            email,
          };
        });
        this.agents = agents;
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },

    clearFilters() {
      this.filteredSectorUuid = '';
      this.filteredAgent = '';
      this.tags = [];
      this.filteredDateRange = {
        start: null,
      };
      this.sendFilter('todos', null, null, null, null);
    },
  },

  watch: {
    filteredSectorUuid: {
      deep: true,
      handler() {
        this.sendFilter('sector', this.filteredSectorUuid, null, null, null);
      },
    },
    filteredAgent: {
      deep: true,
      handler() {
        this.sendFilter('sector', this.filteredSectorUuid, this.filteredAgent, null, null);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.dashboard-filters {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  width: 99%;

  & > *:not(:last-child) {
    min-width: 16.5rem;
  }
}
.option {
  color: $unnnic-color-neutral-dark;
  font-size: 0.75rem;
}
.attachment-options-container {
  padding: 0rem 0.5rem;
}
</style>
