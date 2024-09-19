<template>
  <section class="dashboard-filters">
    <div
      :class="[
        'dashboard-filters__align-to-metrics',
        { 'without-sector': sectorsToFilter.length < 3 },
      ]"
    >
      <div
        v-if="sectorsToFilter.length > 2"
        class="dashboard-filters__input"
      >
        <UnnnicLabel :label="$t('sector.title')" />
        <UnnnicSelectSmart
          v-model="filterSector"
          :options="sectorsToFilter"
          orderedByIndex
          autocomplete
          autocompleteClearOnFocus
        />
      </div>
      <div class="dashboard-filters__input">
        <UnnnicLabel :label="$t('agent')" />
        <UnnnicSelectSmart
          v-model="filterAgent"
          :options="agentsToFilter"
          :disabled="
            filterSector[0]?.value === 'all' || agentsToFilter.length < 2
          "
          orderedByIndex
          autocomplete
          autocompleteClearOnFocus
        />
      </div>
      <div class="dashboard-filters__input">
        <UnnnicLabel :label="$t('tag')" />
        <UnnnicSelectSmart
          v-model="filterTag"
          :disabled="
            filterSector[0]?.value === 'all' || tagsToFilter.length < 2
          "
          :options="tagsToFilter"
          orderedByIndex
          autocomplete
          autocompleteClearOnFocus
        />
      </div>
    </div>
    <div class="dashboard-filters__input">
      <UnnnicLabel :label="$t('date')" />
      <UnnnicInputDatePicker
        v-model="filterDate"
        position="right"
        :inputFormat="$t('date_format')"
        class="dashboard-filters__input__date-picker"
      />
    </div>

    <UnnnicButton
      :text="$t('clear')"
      :disabled="isFiltersDefault"
      type="secondary"
      @click="resetFilters"
    />

    <UnnnicDropdown
      v-bind="$props"
      class="dashboard-filters__export"
    >
      <template #trigger>
        <UnnnicButton
          iconCenter="more_vert"
          type="secondary"
        />
      </template>
      <div
        class="attachment-options-container"
        style="width: 155px"
      >
        <UnnnicDropdownItem class="option">
          <span
            class="upload-dropdown-option"
            @click="downloadMetric('metrics_csv')"
            @keypress.enter="downloadMetric('metrics_csv')"
          >
            <span> {{ $t('export.metrics', { filetype: 'CSV' }) }} </span>
          </span>
        </UnnnicDropdownItem>
        <UnnnicDropdownItem class="option">
          <span
            class="upload-dropdown-option"
            @click="downloadDashboardData('all_csv')"
            @keypress.enter="downloadDashboardData('all_csv')"
          >
            <span> {{ $t('export.all', { filetype: 'CSV' }) }} </span>
          </span>
        </UnnnicDropdownItem>
        <UnnnicDropdownItem class="option">
          <span
            class="upload-dropdown-option"
            @click="downloadMetric('metrics_xls')"
            @keypress.enter="downloadMetric('metrics_xls')"
          >
            <span> {{ $t('export.metrics', { filetype: 'XLS' }) }} </span>
          </span>
        </UnnnicDropdownItem>
        <UnnnicDropdownItem class="option">
          <span
            class="upload-dropdown-option"
            @click="downloadDashboardData('all_xls')"
            @keypress.enter="downloadDashboardData('all_xls')"
          >
            <span> {{ $t('export.all', { filetype: 'XLS' }) }} </span>
          </span>
        </UnnnicDropdownItem>
      </div>
    </UnnnicDropdown>
  </section>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';

export default {
  name: 'DashboardFilters',

  props: {
    sectors: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['filter'],

  data: () => ({
    sectorsToFilter: [],
    agentsToFilter: [],
    tagsToFilter: [],
    filterSector: [],
    filterAgent: [],
    filterTag: [],
    filterDate: {
      start: null,
      end: null,
    },
  }),

  computed: {
    filterSectorsOptionAll() {
      return { value: 'all', label: this.$t('all') };
    },

    filterAgentDefault() {
      return [{ value: '', label: this.$t('filter.by_agent') }];
    },

    filterTagDefault() {
      return [{ value: '', label: this.$t('filter.by_tag') }];
    },

    filterDateDefault() {
      return {
        start: null,
        end: null,
      };
    },

    filterOptionNone() {
      return [{ value: 'none', label: this.$t('none') }];
    },

    isFiltersDefault() {
      const {
        sectorsToFilter,
        filterSector,
        filterAgent,
        filterTag,
        filterDate,
        filterDateDefault,
      } = this;

      if (
        (filterSector[0]?.value === 'all' || sectorsToFilter.length === 2) &&
        filterAgent.length === 0 &&
        filterTag.length === 0 &&
        filterDate === filterDateDefault
      ) {
        return true;
      }

      return false;
    },
  },

  watch: {
    sectors: 'treatSectors',
    filterSector: 'sendFilter',
    filterAgent: 'sendFilter',
    filterTag: 'sendFilter',
    filterDate: 'sendFilter',
  },

  async created() {
    this.filterSector = [this.filterSectorsOptionAll];
    this.agentsToFilter = this.filterAgentDefault.concat(this.filterOptionNone);
    this.tagsToFilter = this.filterTagDefault.concat(this.filterOptionNone);
  },

  methods: {
    cleanFilter(property = '') {
      const filterValue = this[property][0]?.value;
      return filterValue === 'all' || filterValue === 'none' ? '' : filterValue;
    },

    async downloadMetric(option) {
      const { cleanFilter, filterDate } = this;
      try {
        await DashboardManagerApi.downloadMetricData(
          cleanFilter('filterSector'),
          cleanFilter('filterAgent'),
          cleanFilter('filterTag'),
          filterDate.start,
          filterDate.end,
          option,
        );
      } catch (error) {
        console.log(error);
      }
    },
    async downloadDashboardData(option) {
      const { cleanFilter, filterDate } = this;
      try {
        await DashboardManagerApi.downloadAllData(
          cleanFilter('filterSector'),
          cleanFilter('filterAgent'),
          cleanFilter('filterTag'),
          filterDate.start,
          filterDate.end,
          option,
        );
      } catch (error) {
        console.log(error);
      }
    },

    async treatSectors() {
      const { sectors } = this;

      try {
        const newSectors = [this.filterSectorsOptionAll];
        sectors.forEach(({ uuid, name }) =>
          newSectors.push({ value: uuid, label: name }),
        );
        this.sectorsToFilter = newSectors;

        if (sectors.length === 1) {
          this.filterSector = [newSectors[1]];
        }

        if (sectors.length > 0) {
          this.getSectorAgents(sectors[0].uuid);
          this.getSectorTags(sectors[0].uuid);
        }
      } catch (error) {
        console.error('The sectors could not be loaded at this time.', error);
      }
    },

    async getSectorAgents(sectorUuid) {
      if (!sectorUuid) {
        this.agentsToFilter = [];
        return;
      }
      try {
        const results = await Sector.agents({ sectorUuid });
        const newAgents = this.agentsToFilter;
        results.forEach(({ first_name, last_name, email }) => {
          newAgents.push({
            label: [first_name, last_name].join(' ').trim() || email,
            value: email,
          });
        });
        this.agentsToFilter = newAgents;
      } catch (error) {
        console.error(
          'The sector agents could not be loaded at this time.',
          error,
        );
      }
    },

    async getSectorTags(sectorUuid) {
      if (!sectorUuid) {
        this.tagsToFilter = [];
        return;
      }
      try {
        const { results } = await Sector.tags(sectorUuid);

        const newTags = this.tagsToFilter;
        results.forEach(({ uuid, name }) =>
          newTags.push({ value: uuid, label: name }),
        );
        this.tagsToFilter = newTags;
      } catch (error) {
        console.error(
          'The sector tags could not be loaded at this time.',
          error,
        );
      }
    },

    sendFilter() {
      const { cleanFilter, filterDate } = this;
      const filter = {
        sector: cleanFilter('filterSector'),
        tags: cleanFilter('filterTag'),
        agent: cleanFilter('filterAgent'),
        filterDate,
      };
      this.$emit('filter', filter);
    },

    resetFilters() {
      if (this.isFiltersDefault) {
        return;
      }

      this.filterAgent = [this.filterAgentDefault];
      this.filterTag = [this.filterTagDefault];
      if (this.sectorsToFilter.length > 2) {
        this.filterSector = [this.filterSectorsOptionAll];
      }
      this.filterDate = this.filterDateDefault;

      this.sendFilter();
    },

    updateFiltering(filter) {
      if (!filter?.[0]?.value) {
        return;
      }

      this.sendFilter();
    },
  },
};
</script>

<style lang="scss" scoped>
.dashboard-filters {
  display: flex;
  gap: $unnnic-spacing-sm;
  align-items: flex-end;

  width: 100%;

  &__align-to-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-spacing-sm;

    width: calc(69.1% + ($unnnic-spacing-sm * 2));

    &.without-sector {
      grid-template-columns: repeat(2, 1fr);

      width: calc(47% + ($unnnic-spacing-sm * 1));
    }
  }

  &__input__date-picker {
    :deep(.input) {
      min-width: 230px;
    }
    display: grid;
  }

  &__export {
    margin-left: auto;
  }

  .unnnic-label__label {
    margin: 0;
    margin-bottom: $unnnic-spacing-nano;
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
