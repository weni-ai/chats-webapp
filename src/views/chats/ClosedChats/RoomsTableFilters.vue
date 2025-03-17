<template>
  <div class="rooms-table-filters__container">
    <RoomsTableFiltersLoading
      v-if="isFiltersLoading"
      :vertically="vertically"
    />
    <section
      v-else
      class="rooms-table-filters"
      :class="{ 'rooms-table-filters--vertically': vertically }"
    >
      <div class="rooms-table-filters__input">
        <UnnnicLabel :label="$t('chats.search_contact')" />
        <UnnnicInput
          v-model="filterContact"
          iconLeft="search-1"
          :placeholder="$t('name_or_phone')"
        />
      </div>
      <div
        v-if="sectorsToFilter.length > 2"
        class="rooms-table-filters__input"
      >
        <UnnnicLabel :label="$t('sector.title')" />
        <UnnnicSelectSmart
          v-model="filterSector"
          :options="sectorsToFilter"
          orderedByIndex
        />
      </div>
      <div class="rooms-table-filters__input">
        <UnnnicLabel :label="$t('tags.title')" />
        <UnnnicSelectSmart
          v-model="filterTag"
          :disabled="
            filterSector[0]?.value === 'all' || tagsToFilter.length < 2
          "
          :options="tagsToFilter"
          multiple
        />
      </div>
      <div class="rooms-table-filters__input">
        <UnnnicLabel :label="$t('date')" />
        <UnnnicSelectSmart
          v-if="isMobile"
          v-model="filterDate"
          :options="datesToFilter"
          orderedByIndex
        />
        <UnnnicInputDatePicker
          v-else
          v-model="filterDate"
          class="rooms-table-filters__date-picker"
          position="right"
          :inputFormat="$t('date_format')"
        />
      </div>
      <UnnnicButton
        class="rooms-table-filters__clear-button"
        :iconLeft="clearFiltersIconLeft"
        :text="$t('clear')"
        :disabled="isFiltersDefault"
        :type="clearFiltersType"
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
  },

  watch: {
    filterContact() {
      const TIME_TO_WAIT_TYPING = 800;

      if (isMobile) {
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

        if (results.length === 1) {
          this.filterSector = [newSectors[1]];
        }
      } catch (error) {
        console.error('The sectors could not be loaded at this time.', error);
      }
    },

    async getSectorTags(sectorUuid) {
      this.filterTag = [];

      if (!sectorUuid) {
        this.tagsToFilter = [];
        return;
      }

      try {
        const { results } = await Sector.tags(sectorUuid);

        const filterTagPlaceholder = results.length
          ? this.filterTagDefault
          : this.filterTagEmpty;

        const newTags = [filterTagPlaceholder];

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

    resetFilters() {
      if (this.isFiltersDefault) {
        return;
      }

      this.filterContact = '';
      if (this.sectorsToFilter.length > 2) {
        this.filterSector = [this.filterSectorsOptionAll];
      }
      this.filterTag = [];
      this.filterDate = this.filterDateDefault;
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

      const dateStart = this.getRelativeDate(filterDate[0]?.value, 'digit');
      const dateEnd = this.getRelativeDate('today', 'digit');

      this.$emit('input', {
        contact: filterContact,
        sector: filterSector,
        tag: filterTag,
        date: {
          start: filterDate.start || dateStart,
          end: filterDate.end || dateEnd,
        },
      });
    },

    setFiltersByQueryParams() {
      const { contactUrn, startDate, endDate } = this.$route.query;

      this.filterContact = contactUrn || '';

      if (startDate) {
        this.filterDate.start = startDate;
      }

      if (endDate) {
        this.filterDate.end = endDate;
      }
    },

    updateFiltersByValue() {
      if (this.value) {
        const { contact, sector, tag, date } = this.value;
        const dateStart = this.getRelativeDate(date.start, 'extensive');
        const matchingDate = this.datesToFilter.find(
          (date) => date.value === dateStart,
        );

        this.filterContact = contact;
        this.filterSector = sector;
        this.filterTag = tag;
        this.filterDate = [matchingDate];
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
