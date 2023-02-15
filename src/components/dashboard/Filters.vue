<template>
  <section class="dashboard-filters">
    <div class="dashboard-filters" style="z-index: 100">
      <unnnic-select
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
        v-model="selecteds"
        :items="tags"
        :placeholder="this.messageInputTags"
        :disabled="!this.filteredSectorUuid && sectors.length !== 1"
        @input="sendFilter('sector', filteredSectorUuid, filteredAgent, selecteds)"
      />

      <!-- <unnnic-input-date-picker
        style="min-width: 15px"
        v-model="filteredDateRange"
        size="md"
        class="input"
        :input-format="$t('date_format')"
        position="right"
      /> -->

      <unnnic-tool-tip enabled text="Limpar filtro" side="right">
        <unnnic-button-icon
          icon="button-refresh-arrows-1"
          size="large"
          class="clear-filters-btn"
          @click="clearFilters"
        />
      </unnnic-tool-tip>
    </div>
  </section>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';

const moment = require('moment');

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
      start: moment(new Date()).format('YYYY-MM-DD'),
      end: moment(new Date()).format('YYYY-MM-DD'),
    },
  }),

  methods: {
    sendFilter(type, filteredSectorUuid, agent, tag) {
      const filter = {
        type,
        sectorUuid: filteredSectorUuid,
        tag,
        agent,
        date: this.filteredDateRange,
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
        start: moment(new Date()).format('YYYY-MM-DD'),
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

  & > *:not(:last-child) {
    min-width: 16.5rem;
  }
}
</style>
