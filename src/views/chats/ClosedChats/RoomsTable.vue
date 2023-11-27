<template>
  <section class="closed-chats__rooms-table">
    <rooms-table-filters-loading v-if="isFiltersLoading" />
    <section v-else class="closed-chats__rooms-table__handlers">
      <div class="closed-chats__rooms-table__handlers__input">
        <unnnic-label :label="$t('chats.search_contact')" />
        <unnnic-input
          v-model="filterContact"
          icon-left="search-1"
          :placeholder="$t('name_or_phone')"
        />
      </div>
      <div class="closed-chats__rooms-table__handlers__input">
        <unnnic-label :label="$t('sector.title')" />
        <unnnic-select-smart v-model="filterSector" :options="sectorsToFilter" ordered-by-index />
      </div>
      <div class="closed-chats__rooms-table__handlers__input">
        <unnnic-label :label="$t('tags.title')" />
        <unnnic-select-smart
          v-model="filterTag"
          :disabled="filterSector[0]?.value === 'all' || tagsToFilter.length < 2"
          :options="tagsToFilter"
          multiple
        />
      </div>
      <div class="closed-chats__rooms-table__handlers__input">
        <unnnic-label :label="$t('date')" />
        <unnnic-input-date-picker
          class="closed-chats__rooms-table__handlers__date-picker"
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

    <rooms-table-loading v-if="isTableLoading" />
    <unnnic-table
      v-if="!isTableLoading && this.rooms.length > 0"
      :items="rooms"
      class="closed-chats__rooms-table__table"
    >
      <template #header>
        <unnnic-table-row :headers="tableHeaders" />
      </template>

      <template #item="{ item }">
        <unnnic-table-row :headers="tableHeaders">
          <template #contactName>
            <div class="closed-chats__rooms-table__table__contact">
              <unnnic-chats-user-avatar :username="item.contact.name" />
              <p class="closed-chats__rooms-table__table__contact__name">
                {{ item.contact.name }}
              </p>
            </div>
          </template>

          <template #agentName>{{ item.user?.first_name }}</template>

          <template #tags>
            <tag-group :tags="item.tags || []" :flex="false" />
          </template>

          <template #date>{{ $d(new Date(item.ended_at)) }}</template>

          <template #visualize>
            <unnnic-button
              class="closed-chats__rooms-table__table__visualize"
              :text="$t('see')"
              type="secondary"
              size="small"
              @click="
                $router.push({ name: 'closed-rooms.selected', params: { roomId: item.uuid } })
              "
            />
          </template>
        </unnnic-table-row>
      </template>
    </unnnic-table>
    <p
      v-if="!isTableLoading && this.rooms.length === 0"
      class="closed-chats__rooms-table__table__no-results"
    >
      {{ $t('without_results') }}
    </p>

    <table-pagination
      v-model="roomsCurrentPage"
      :count="roomsCount"
      :countPages="roomsCountPages"
      :limit="roomsLimit"
      :is-loading="isPagesLoading"
    />
  </section>
</template>

<script>
import moment from 'moment';

import Sector from '@/services/api/resources/settings/sector';
import History from '@/services/api/resources/chats/history';

import RoomsTableFiltersLoading from '@/views/loadings/ClosedChats/RoomsTableFiltersLoading';
import RoomsTableLoading from '@/views/loadings/ClosedChats/RoomsTableLoading';
import TablePagination from '@/components/TablePagination';
import TagGroup from '@/components/TagGroup.vue';

export default {
  name: 'ClosedChatsRoomsTable',

  components: {
    TagGroup,
    RoomsTableFiltersLoading,
    RoomsTableLoading,
    TablePagination,
  },

  props: {
    project: {
      type: Object,
      default: null,
    },
  },

  data: () => ({
    isFiltersLoading: true,
    isTableLoading: true,
    isPagesLoading: true,

    rooms: [],
    roomsCount: 0,
    roomsCountPages: 0,
    roomsCurrentPage: 1,
    roomsLimit: 5,

    sectorsToFilter: [],
    tagsToFilter: [],
    filterContact: '',
    filterSector: [],
    filterTag: [],
    filterDate: {
      start: moment().subtract(1, 'week').format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD'),
    },
  }),

  async created() {
    this.isFiltersLoading = true;

    await this.getSectors();
    this.filterSector = [this.filterSectorsOptionAll];
    this.filterDate = this.filterDateDefault;
    this.tagsToFilter = this.filterTagDefault;

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

    tableHeaders() {
      return [
        {
          id: 'contactName',
          text: this.$t('contact'),
          flex: 1,
        },
        {
          id: 'agentName',
          text: this.$t('agent'),
          flex: 1,
        },
        {
          id: 'tags',
          text: this.$t('tags.title'),
          flex: 1,
        },
        {
          id: 'date',
          text: this.$t('date'),
          flex: 1,
        },
        {
          id: 'visualize',
          text: this.$t('view'),
          flex: 1,
        },
      ];
    },

    isFiltersDefault() {
      const { filterContact, filterSector, filterTag, filterDate, filterDateDefault } = this;

      if (
        filterContact === '' &&
        filterSector[0].value === 'all' &&
        filterTag.length === 0 &&
        filterDate === filterDateDefault
      ) {
        return true;
      }

      return false;
    },
  },

  methods: {
    async getHistoryRooms(paginate) {
      this.isTableLoading = true;
      this.isPagesLoading = true;

      const { roomsCurrentPage, roomsLimit, filterDate, filterContact, filterSector, filterTag } =
        this;

      if (paginate !== true) {
        this.roomsCurrentPage = 1;
      }

      const offset = (roomsCurrentPage - 1) * roomsLimit;
      const tagsToReq = filterTag.map((tag) => tag.label).join(',');
      const sectionToReq = filterSector[0]?.value === 'all' ? '' : filterSector[0]?.value;

      try {
        const response = await History.getHistoryRooms({
          offset,
          limit: roomsLimit,
          ended_at_before: filterDate.end,
          ended_at_after: filterDate.start,
          search: filterContact,
          sector: sectionToReq,
          tag: tagsToReq,
        });
        this.rooms = response.results;
        this.roomsCount = response.count;
        this.roomsCountPages = Math.ceil(response.count / roomsLimit);
      } catch (error) {
        console.log(error);
      }

      this.isTableLoading = false;
      this.isPagesLoading = false;
    },

    async getSectors() {
      try {
        const response = await Sector.list();
        const { results } = response;

        const newSectors = [this.filterSectorsOptionAll];
        results.forEach(({ uuid, name }) => newSectors.push({ value: uuid, label: name }));
        this.sectorsToFilter = newSectors;

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
        const response = await Sector.tags(sectorUuid);
        const { results } = response;

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
      this.filterSector = [this.filterSectorsOptionAll];
      this.filterTag = [];
      this.filterDate = this.filterDateDefault;
    },
  },

  watch: {
    roomsCurrentPage() {
      this.getHistoryRooms(true);
    },
    filterContact() {
      const TIME_TO_WAIT_TYPING = 800;

      if (this.timeout !== 0) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.getHistoryRooms();
      }, TIME_TO_WAIT_TYPING);
    },
    filterSector: 'getHistoryRooms',
    filterTag: 'getHistoryRooms',
    filterDate: 'getHistoryRooms',
  },
};
</script>

<style lang="scss" scoped>
.closed-chats {
  &__rooms-table {
    padding: $unnnic-spacing-md;
    padding-top: $unnnic-spacing-sm;

    display: grid;
    gap: $unnnic-spacing-sm;

    grid-template-rows: auto 1fr auto;
    height: 100%;

    &__handlers {
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

    &__table {
      overflow: hidden;

      &__no-results {
        color: $unnnic-color-neutral-cloudy;
        font-size: $unnnic-font-size-body-gt;
      }

      &__contact {
        display: flex;
        align-items: center;
        gap: $unnnic-spacing-nano;

        &__name {
          overflow: hidden;

          width: 100%;

          font-size: $unnnic-font-size-body-lg;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      &__visualize {
        width: 100%;
      }
    }
  }
}
</style>
