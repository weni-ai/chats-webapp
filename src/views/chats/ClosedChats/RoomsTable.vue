<template>
  <section class="closed-chats__rooms-table">
    <closed-chats-rooms-table-filters @update-filters="filters = $event" />

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
import History from '@/services/api/resources/chats/history';

import RoomsTableLoading from '@/views/loadings/ClosedChats/RoomsTableLoading';
import TablePagination from '@/components/TablePagination';
import TagGroup from '@/components/TagGroup.vue';

import ClosedChatsRoomsTableFilters from './RoomsTableFilters.vue';

export default {
  name: 'ClosedChatsRoomsTable',

  components: {
    TagGroup,
    ClosedChatsRoomsTableFilters,
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
    isTableLoading: true,
    isPagesLoading: true,

    rooms: [],
    roomsCount: 0,
    roomsCountPages: 0,
    roomsCurrentPage: 1,
    roomsLimit: 5,

    filters: {
      contact: '',
      sector: [],
      tag: [],
      date: null,
    },
  }),

  computed: {
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
  },

  methods: {
    async getHistoryRooms(paginate) {
      this.isTableLoading = true;
      this.isPagesLoading = true;

      const {
        roomsCurrentPage,
        roomsLimit,
        filters: { date, contact, sector, tag },
      } = this;

      if (paginate !== true) {
        this.roomsCurrentPage = 1;
      }

      const offset = (roomsCurrentPage - 1) * roomsLimit;
      const tagsToReq = tag.map((tag) => tag.label).join(',');
      const sectionToReq = sector[0]?.value === 'all' ? '' : sector[0]?.value;

      try {
        const response = await History.getHistoryRooms({
          offset,
          limit: roomsLimit,
          ended_at_before: date.end,
          ended_at_after: date.start,
          search: contact,
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
  },

  watch: {
    roomsCurrentPage() {
      this.getHistoryRooms(true);
    },
    filters: 'getHistoryRooms',
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
