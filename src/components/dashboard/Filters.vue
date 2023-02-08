<template>
  <section class="dashboard-filters">
    <div class="dashboard-filters" style="z-index: 100">
      <unnnic-select
        v-model="filteredSectorUuid"
        label="Filtar por setor"
        size="md"
        class="input"
        @input="getSectorTags(filteredSectorUuid), sendFilter('sector', filteredSectorUuid)"
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

      <unnnic-autocomplete-select
        v-model="selecteds"
        :items="tags"
        :placeholder="this.messageInputTags"
        :disabled="!this.filteredSectorUuid && sectors.length !== 1"
        @input="sendFilter('sector', filteredSectorUuid, selecteds)"
      />

      <unnnic-input-date-picker
        style="min-width: 15px"
        v-model="filteredDateRange"
        size="md"
        class="input"
        :input-format="$t('date_format')"
        position="right"
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
  </section>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';

const moment = require('moment');

export default {
  name: 'DashboardFilters',

  beforeMount() {
    if (this.tag) this.filteredTags.push(this.tag);
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
    messageInputTags: 'Filtrar por tags',
    sectors: [],
    sectorTags: [],
    tags: [],
    selecteds: [],
    filteredDateRange: {
      start: moment(new Date()).format('YYYY-MM-DD'),
      end: moment(new Date()).format('YYYY-MM-DD'),
    },
  }),

  methods: {
    sendFilter(type, filteredSectorUuid, tag) {
      const filter = {
        type,
        sectorUuid: filteredSectorUuid,
        tag,
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

    clearFilters() {
      this.filteredSectorUuid = '';
      this.tags = [];
      this.filteredDateRange = {
        start: moment(new Date()).format('YYYY-MM-DD'),
      };
      this.sendFilter('todos', null, null, null);
    },
  },

  watch: {
    filteredSectorUuid: {
      deep: true,
      handler() {
        this.sendFilter('sector', this.filteredSectorUuid, null, null);
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
