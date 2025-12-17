<template>
  <div
    class="rooms-table-filters__container"
    data-testid="rooms-table-filters-container"
  >
    <RoomsTableFiltersLoading
      v-if="isFiltersLoading"
      :vertically="vertically"
      data-testid="filters-loading"
    />
    <section
      v-else
      class="rooms-table-filters"
      :class="{ 'rooms-table-filters--vertically': vertically }"
      data-testid="rooms-table-filters"
    >
      <div
        class="rooms-table-filters__input"
        data-testid="contact-filter"
      >
        <UnnnicLabel :label="$t('chats.search_contact')" />
        <UnnnicInput
          v-model="filterContact"
          iconLeft="search-1"
          :placeholder="$t('name_or_phone_or_protocol')"
          data-testid="filter-contact-input"
        />
      </div>
      <div
        class="rooms-table-filters__input"
        data-testid="sector-filter"
      >
        <UnnnicLabel :label="$t('sector.title')" />
        <UnnnicSelectSmart
          v-model="filterSector"
          :options="sectorsToFilter"
          orderedByIndex
          :locale="$i18n.locale"
          data-testid="filter-sector-select"
        />
      </div>
      <div
        class="rooms-table-filters__input"
        data-testid="tag-filter"
      >
        <UnnnicLabel :label="$t('tags.title')" />
        <UnnnicSelectSmart
          v-model="filterTag"
          :disabled="
            filterSector[0]?.value === 'all' || tagsToFilter.length < 2
          "
          :options="tagsToFilter"
          :locale="$i18n.locale"
          multiple
          data-testid="filter-tag-select"
        />
      </div>
      <div
        class="rooms-table-filters__input"
        data-testid="date-filter"
      >
        <UnnnicLabel :label="$t('date')" />
        <UnnnicSelectSmart
          v-if="isMobile"
          v-model="filterDate"
          :options="datesToFilter"
          orderedByIndex
          data-testid="filter-date-mobile-select"
        />
        <UnnnicInputDatePicker
          v-else
          v-model="filterDate"
          :options="filterDateOptions"
          class="rooms-table-filters__date-picker"
          position="right"
          :inputFormat="$t('date_format')"
          :minDate="datePickerMinDate"
          :maxDate="datePickerMaxDate"
          data-testid="filter-date-picker"
          @select-date="handleDateSelect"
          @update:model-value="updateFilterDate"
        />
      </div>
      <UnnnicButton
        class="rooms-table-filters__clear-button"
        :iconLeft="clearFiltersIconLeft"
        :text="$t('clear')"
        :disabled="isFiltersDefault"
        :type="clearFiltersType"
        data-testid="filter-clear-button"
        @click="resetFilters"
      />
    </section>
  </div>
</template>

<script>
import moment from 'moment';
import isMobile from 'is-mobile';

import Sector from '@/services/api/resources/settings/sector';

import RoomsTableFiltersLoading from '@/views/loadings/ClosedChats/RoomsTableFiltersLoading.vue';

import { removeDuplicatedItems } from '@/utils/array';

export default {
  name: 'ClosedChatsRoomsTableFilters',

  components: {
    RoomsTableFiltersLoading,
  },

  props: {
    value: {
      type: Object,
      default: null,
    },
    vertically: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['input'],

  data() {
    return {
      isMobile: isMobile(),

      isFiltersLoading: true,
      filterContactTimeout: 0,

      sectorsToFilter: [],
      tagsToFilter: [],
      datesToFilter: [],

      filterContact: '',
      filterSector: [],
      filterTag: [],
      filterDate: null,
      tagsNext: '',
      selectedDatesInternal: { start: null, end: null },
    };
  },

  computed: {
    filterSectorsOptionAll() {
      return { value: 'all', label: this.$t('all') };
    },

    filterTagEmpty() {
      return { value: '', label: this.$t('filter.empty_tags') };
    },

    filterTagDefault() {
      return { value: '', label: this.$t('filter.by_tags') };
    },

    filterDateDefault() {
      if (this.isMobile) {
        return [this.datesToFilter.find((obj) => obj.value === 'last_7_days')];
      }
      return {
        start: moment().subtract(1, 'week').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD'),
      };
    },

    filterDateOptions() {
      return [
        {
          name: this.$t('filter.dates.last_7_days'),
          id: 'last-7-days',
        },
        {
          name: this.$t('filter.dates.last_14_days'),
          id: 'last-14-days',
        },
        {
          name: this.$t('filter.dates.last_30_days'),
          id: 'last-30-days',
        },
        {
          name: this.$t('filter.dates.last_45_days'),
          id: 'last-45-days',
        },
        {
          name: this.$t('filter.dates.last_90_days'),
          id: 'last-90-days',
        },
      ];
    },
    datesToFilterOptions() {
      return [
        'today',
        'yesterday',
        'last_7_days',
        'last_30_days',
        'current_month',
        'last_12_months',
      ].map((date) => ({
        value: date,
        label: this.$t(`filter.dates.${date}`),
      }));
    },

    isFiltersDefault() {
      const {
        sectorsToFilter,
        filterContact,
        filterSector,
        filterTag,
        filterDate,
        filterDateDefault,
      } = this;

      if (
        filterContact === '' &&
        (filterSector[0]?.value === 'all' || sectorsToFilter.length === 2) &&
        filterTag.length === 0 &&
        filterDate === filterDateDefault
      ) {
        return true;
      }

      return false;
    },

    clearFiltersIconLeft() {
      return this.isMobile ? 'cached' : '';
    },
    clearFiltersType() {
      return this.isMobile ? 'tertiary' : 'secondary';
    },

    datePickerMinDate() {
      const currentSelection = this.selectedDatesInternal;
      const defaultMin = moment().subtract(89, 'days').format('YYYY-MM-DD');

      if (!currentSelection || !currentSelection.start || this.isMobile) {
        return defaultMin;
      }

      const momentStart = moment(currentSelection.start);

      if (
        momentStart.isValid() &&
        (!currentSelection.end ||
          currentSelection.start === currentSelection.end)
      ) {
        const calculatedMin = momentStart
          .clone()
          .subtract(89, 'days')
          .format('YYYY-MM-DD');
        return moment(calculatedMin).isValid() ? calculatedMin : defaultMin;
      }

      if (!momentStart.isValid()) {
        return null;
      }

      if (
        momentStart.isValid() &&
        defaultMin !== momentStart.format('YYYY-MM-DD')
      ) {
        return momentStart.clone().subtract(89, 'days').format('YYYY-MM-DD');
      }

      return defaultMin;
    },

    datePickerMaxDate() {
      const today = moment();
      const currentSelection = this.selectedDatesInternal;
      const defaultMax = today.format('YYYY-MM-DD');

      if (!currentSelection || !currentSelection.start || this.isMobile) {
        return defaultMax;
      }

      const momentStart = moment(currentSelection.start);

      if (
        momentStart.isValid() &&
        (!currentSelection.end ||
          currentSelection.start === currentSelection.end)
      ) {
        const calculatedMax = momentStart.clone().add(89, 'days');
        if (calculatedMax.isAfter(today)) {
          return defaultMax;
        }
        return calculatedMax.format('YYYY-MM-DD');
      }

      return defaultMax;
    },
  },

  watch: {
    filterContact() {
      const TIME_TO_WAIT_TYPING = 800;

      if (this.isMobile) {
        this.emitUpdateFilters();
      }

      if (this.filterContactTimeout !== 0)
        clearTimeout(this.filterContactTimeout);
      this.filterContactTimeout = setTimeout(() => {
        this.emitUpdateFilters();
      }, TIME_TO_WAIT_TYPING);
    },

    filterSector(newFilterSector) {
      const sectorValue = newFilterSector?.[0].value;
      if (sectorValue !== 'all') {
        this.filterTag = [];
        this.tagsNext = '';
        this.tagsToFilter = [this.filterTagDefault];
        this.getSectorTags(sectorValue);
      } else {
        this.tagsToFilter = [this.filterTagDefault];
        this.filterTag = [];
      }
    },
    filterTag: 'emitUpdateFilters',
    filterDate: 'emitUpdateFilters',
  },

  async created() {
    this.isFiltersLoading = true;

    this.datesToFilter = this.datesToFilterOptions;
    this.filterSector = [this.filterSectorsOptionAll];
    this.filterDate = this.filterDateDefault;
    if (!this.isMobile && this.filterDate) {
      this.selectedDatesInternal = { ...this.filterDate };
    }
    this.tagsToFilter = [this.filterTagDefault];

    this.setFiltersByQueryParams();
    this.updateFiltersByValue();

    await this.getSectors();

    this.isFiltersLoading = false;
  },

  methods: {
    async getSectors() {
      try {
        const { results } = await Sector.list({ limit: 50 });

        const newSectors = [this.filterSectorsOptionAll];
        results.forEach(({ uuid, name }) =>
          newSectors.push({ value: uuid, label: name }),
        );
        this.sectorsToFilter = newSectors;
      } catch (error) {
        console.error('The sectors could not be loaded at this time.', error);
      }
    },

    async getSectorTags(sectorUuid) {
      if (!sectorUuid) {
        this.tagsToFilter = [];
        return;
      }

      try {
        const { results, next } = await Sector.tags(sectorUuid, {
          next: this.tagsNext,
          limit: 20,
        });

        const filterTagPlaceholder = results.length
          ? this.filterTagDefault
          : this.filterTagEmpty;

        const newTags = [filterTagPlaceholder];

        results.forEach(({ uuid, name }) =>
          newTags.push({ value: uuid, label: name }),
        );

        this.tagsToFilter = removeDuplicatedItems(
          this.tagsToFilter.concat(newTags),
          'value',
        );
        this.tagsNext = next;
      } catch (error) {
        console.error(
          'The sector tags could not be loaded at this time.',
          error,
        );
      } finally {
        if (this.tagsNext) this.getSectorTags(sectorUuid);
      }
    },

    handleDateSelect(payload) {
      if (!this.isMobile) {
        this.selectedDatesInternal = payload;
      }
    },

    updateFilterDate(payload) {
      this.filterDate = payload;
    },

    resetFilters() {
      if (this.isFiltersDefault) {
        return;
      }

      this.filterContact = '';

      this.filterSector = [this.filterSectorsOptionAll];

      this.filterTag = [];
      this.filterDate = this.filterDateDefault;
      if (!this.isMobile && this.filterDate) {
        this.selectedDatesInternal = { ...this.filterDate };
      } else if (this.isMobile) {
        this.selectedDatesInternal = { start: null, end: null };
      }
    },

    getRelativeDate(date, type = 'extensive') {
      const getRelativeDate = (offset, unit) =>
        moment().subtract(offset, unit).format('YYYY-MM-DD');
      const digitDateMapping = {
        today: moment().format('YYYY-MM-DD'),
        yesterday: getRelativeDate(1, 'day'),
        last_7_days: getRelativeDate(1, 'week'),
        last_30_days: getRelativeDate(1, 'month'),
        current_month: moment().startOf('month').format('YYYY-MM-DD'),
        last_12_months: getRelativeDate(12, 'month'),
      };

      if (type === 'extensive') {
        const extensiveDateMapping = {};
        Object.entries(digitDateMapping).forEach(([key, value]) => {
          extensiveDateMapping[value] = key;
        });

        return extensiveDateMapping[date];
      }

      if (type === 'digit') {
        return digitDateMapping[date];
      }
      return '';
    },

    emitUpdateFilters() {
      const { filterContact, filterDate, filterSector, filterTag } = this;

      let dateStart, dateEnd;

      if (this.isMobile) {
        dateStart = this.getRelativeDate(filterDate[0]?.value, 'digit');
        dateEnd = this.getRelativeDate('today', 'digit');
      } else {
        dateStart = filterDate?.start;
        dateEnd = filterDate?.end;
      }

      this.$emit('input', {
        contact: filterContact,
        sector: filterSector,
        tag: filterTag,
        date: {
          start: dateStart,
          end: dateEnd,
        },
      });
    },

    setFiltersByQueryParams() {
      const { contactUrn, startDate, endDate } = this.$route.query;

      this.filterContact = contactUrn || '';

      if (!this.isMobile) {
        if (typeof this.filterDate !== 'object' || this.filterDate === null) {
          this.filterDate = { start: null, end: null };
        }
        if (startDate) {
          this.filterDate.start = startDate;
        }
        if (endDate) {
          this.filterDate.end = endDate;
        }
        this.selectedDatesInternal = { ...this.filterDate };
      } else {
        if (startDate) {
          const dateStartExtensive = this.getRelativeDate(
            startDate,
            'extensive',
          );
          const matchingDate = this.datesToFilter.find(
            (d) => d.value === dateStartExtensive,
          );
          if (matchingDate) this.filterDate = [matchingDate];
          else {
            this.filterDate = [
              this.datesToFilter.find((obj) => obj.value === 'last_7_days'),
            ];
          }
        }
      }
    },

    updateFiltersByValue() {
      if (this.value) {
        const { contact, sector, tag, date } = this.value;

        this.filterContact = contact;
        this.filterSector = sector;
        this.filterTag = tag;

        if (this.isMobile) {
          const dateStartExtensive = this.getRelativeDate(
            date.start,
            'extensive',
          );
          const matchingDate = this.datesToFilter.find(
            (d) => d.value === dateStartExtensive,
          );
          this.filterDate = matchingDate
            ? [matchingDate]
            : [this.datesToFilter.find((obj) => obj.value === 'last_7_days')];
        } else {
          this.filterDate = { start: date.start, end: date.end };
          this.selectedDatesInternal = { ...this.filterDate };
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.rooms-table-filters {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;

  gap: $unnnic-spacing-sm;
  justify-content: space-between;
  align-items: flex-end;

  &--vertically {
    display: flex;
    flex-direction: column;

    .rooms-table-filters {
      &__date-picker,
      &__clear-button {
        width: 100%;
      }
    }

    :deep(.input.unnnic-form) {
      width: 100%;
    }
  }

  .unnnic-label__label {
    margin: 0;
    margin-bottom: $unnnic-spacing-nano;
  }

  &__input {
    width: 100%;
  }

  // .dropdown class comes from the unnnic component and is used here to override its style
  &__date-picker.dropdown {
    display: grid;
  }
}
</style>
