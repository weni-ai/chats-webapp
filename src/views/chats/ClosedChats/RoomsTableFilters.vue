<template>
  <div class="rooms-table-filters__container">
    <rooms-table-filters-loading v-if="isFiltersLoading" />
    <section v-else class="rooms-table-filters">
      <div class="rooms-table-filters__input">
        <unnnic-label :label="$t('chats.search_contact')" />
        <unnnic-input
          v-model="filterContact"
          icon-left="search-1"
          :placeholder="$t('name_or_phone')"
        />
      </div>
      <div class="rooms-table-filters__input" v-if="sectorsToFilter.length > 2">
        <unnnic-label :label="$t('sector.title')" />
        <unnnic-select-smart v-model="filterSector" :options="sectorsToFilter" ordered-by-index />
      </div>
      <div class="rooms-table-filters__input">
        <unnnic-label :label="$t('tags.title')" />
        <unnnic-select-smart
          v-model="filterTag"
          :disabled="filterSector[0]?.value === 'all' || tagsToFilter.length < 2"
          :options="tagsToFilter"
          multiple
        />
      </div>
      <div class="rooms-table-filters__input">
        <unnnic-label :label="$t('date')" />
        <unnnic-input-date-picker
          class="rooms-table-filters__date-picker"
          v-model="filterDate"
          position="right"
          :inputFormat="$t('date_format')"
        />
      </div>
      <unnnic-button
        :text="$t('clear')"
        :disabled="isFiltersDefault"
        type="secondary"
        @click="resetFilters"
      />
    </section>
  </div>
</template>

<script>
import moment from 'moment';

import Sector from '@/services/api/resources/settings/sector';

import RoomsTableFiltersLoading from '@/views/loadings/ClosedChats/RoomsTableFiltersLoading';

export default {
  name: 'ClosedChatsRoomsTableFilters',

  components: {
    RoomsTableFiltersLoading,
  },

  data() {
    return {
      isFiltersLoading: true,
      filterContactTimeout: 0,

      sectorsToFilter: [],
      tagsToFilter: [],
      filterContact: '',
      filterSector: [],
      filterTag: [],
      filterDate: {
        start: moment().subtract(1, 'week').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD'),
      },
    };
  },

  async created() {
    this.isFiltersLoading = true;

    this.filterSector = [this.filterSectorsOptionAll];
    this.filterDate = this.filterDateDefault;
    this.tagsToFilter = this.filterTagDefault;
    await this.getSectors();

    this.isFiltersLoading = false;
  },

  computed: {
    filterSectorsOptionAll() {
      return { value: 'all', label: this.$t('all') };
    },

    filterTagDefault() {
      return [{ value: '', label: this.$t('filter.by_tags') }];
    },

    filterDateDefault() {
      return {
        start: moment().subtract(1, 'week').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD'),
      };
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
  },

  methods: {
    async getSectors() {
      try {
        const { results } = await Sector.list();

        const newSectors = [this.filterSectorsOptionAll];
        results.forEach(({ uuid, name }) => newSectors.push({ value: uuid, label: name }));
        this.sectorsToFilter = newSectors;

        if (results.length === 1) {
          this.filterSector = [newSectors[1]];
        }

        if (results.length > 0) {
          this.getSectorTags(results[0].uuid);
        }
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
        const { results } = await Sector.tags(sectorUuid);

        const newTags = this.tagsToFilter;
        results.forEach(({ uuid, name }) => newTags.push({ value: uuid, label: name }));
        this.tagsToFilter = newTags;
      } catch (error) {
        console.error('The sector tags could not be loaded at this time.', error);
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

    emitUpdateFilters() {
      const { filterContact, filterDate, filterSector, filterTag } = this;

      this.$emit('update-filters', {
        contact: filterContact,
        sector: filterSector,
        tag: filterTag,
        date: filterDate,
      });
    },
  },

  watch: {
    filterContact() {
      const TIME_TO_WAIT_TYPING = 800;

      if (this.filterContactTimeout !== 0) clearTimeout(this.filterContactTimeout);
      this.filterContactTimeout = setTimeout(() => {
        this.emitUpdateFilters();
      }, TIME_TO_WAIT_TYPING);
    },
    filterSector: 'emitUpdateFilters',
    filterTag: 'emitUpdateFilters',
    filterDate: 'emitUpdateFilters',
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

  .unnnic-label__label {
    margin: 0;
    margin-bottom: $unnnic-spacing-nano;
  }

  &__input {
    width: 100%;
  }

  &__date-picker {
    display: grid;
  }
}
</style>
