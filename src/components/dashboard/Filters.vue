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
        <UnnnicSelect
          v-model="filterSector"
          data-testid="dashboard-filter-sector"
          :options="sectorsToFilter"
          :label="$t('sector.title')"
          :placeholder="$t('all')"
          returnObject
          clearable
          enableSearch
          :search="searchSector"
          @update:search="searchSector = $event"
        />
      </div>
      <div class="dashboard-filters__input">
        <UnnnicSelect
          v-model="filterAgent"
          data-testid="dashboard-filter-agent"
          :options="agentsToFilter"
          :disabled="filterSector?.value === 'all' || agentsToFilter.length < 2"
          :label="$t('agent')"
          :placeholder="$t('filter.by_agent')"
          returnObject
          clearable
          enableSearch
          :search="searchAgent"
          @update:search="searchAgent = $event"
        />
      </div>
      <div class="dashboard-filters__input">
        <UnnnicSelect
          v-model="filterTag"
          data-testid="dashboard-filter-tag"
          :options="tagsToFilter"
          :disabled="filterSector?.value === 'all' || tagsToFilter.length < 2"
          :label="$t('tag')"
          :placeholder="$t('filter.by_tag')"
          returnObject
          clearable
          enableSearch
          :search="searchTag"
          @update:search="searchTag = $event"
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
      data-testid="dashboard-filters-clear"
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
          data-testid="download-dropdown-button"
        />
      </template>
      <div
        class="attachment-options-container"
        style="width: 155px"
      >
        <UnnnicDropdownItem class="option">
          <span
            class="upload-dropdown-option"
            data-testid="download-metric-csv"
            @click="downloadMetric('metrics_csv')"
            @keypress.enter="downloadMetric('metrics_csv')"
          >
            <span> {{ $t('export.metrics', { filetype: 'CSV' }) }} </span>
          </span>
        </UnnnicDropdownItem>
        <UnnnicDropdownItem class="option">
          <span
            class="upload-dropdown-option"
            data-testid="download-all-csv"
            @click="downloadDashboardData('all_csv')"
            @keypress.enter="downloadDashboardData('all_csv')"
          >
            <span> {{ $t('export.all', { filetype: 'CSV' }) }} </span>
          </span>
        </UnnnicDropdownItem>
        <UnnnicDropdownItem class="option">
          <span
            class="upload-dropdown-option"
            data-testid="download-metric-xls"
            @click="downloadMetric('metrics_xls')"
            @keypress.enter="downloadMetric('metrics_xls')"
          >
            <span> {{ $t('export.metrics', { filetype: 'XLS' }) }} </span>
          </span>
        </UnnnicDropdownItem>
        <UnnnicDropdownItem class="option">
          <span
            class="upload-dropdown-option"
            data-testid="download-all-xls"
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
    filterSector: null,
    filterAgent: null,
    filterTag: null,
    filterDate: {
      start: null,
      end: null,
    },
    searchSector: '',
    searchAgent: '',
    searchTag: '',
  }),

  computed: {
    filterSectorsOptionAll() {
      return { value: 'all', label: this.$t('all') };
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
      } = this;

      const sectorIsDefault =
        filterSector?.value === 'all' ||
        !filterSector?.value ||
        sectorsToFilter.length === 2;

      const agentIsDefault =
        !filterAgent ||
        filterAgent.value === '' ||
        filterAgent.value === 'none';

      const tagIsDefault =
        !filterTag || filterTag.value === '' || filterTag.value === 'none';

      const dateIsDefault =
        filterDate?.start == null && filterDate?.end == null;

      if (sectorIsDefault && agentIsDefault && tagIsDefault && dateIsDefault) {
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

  created() {
    this.filterSector = this.filterSectorsOptionAll;
    this.agentsToFilter = this.filterOptionNone;
    this.tagsToFilter = this.filterOptionNone;
  },

  methods: {
    cleanFilter(property = '') {
      const raw = this[property];
      const filterValue = raw?.value;

      if (
        filterValue === undefined ||
        filterValue === null ||
        filterValue === ''
      ) {
        return '';
      }

      if (property === 'filterSector') {
        return filterValue === 'all' ? '' : filterValue;
      }

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
          this.filterSector = newSectors[1];
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
        const newAgents = this.filterOptionNone;
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

        const newTags = this.filterOptionNone;
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

      this.filterAgent = null;
      this.filterTag = null;
      if (this.sectorsToFilter.length > 2) {
        this.filterSector = this.filterSectorsOptionAll;
      }
      this.filterDate = this.filterDateDefault;

      this.sendFilter();
    },

    updateFiltering(filter) {
      const value = filter?.value ?? filter?.[0]?.value;
      if (!value) {
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
