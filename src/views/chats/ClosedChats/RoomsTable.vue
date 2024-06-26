<template>
  <section
    class="closed-chats__rooms-table"
    :class="{ mobile: isMobile }"
  >
    <ClosedChatsRoomsTableFilters
      v-show="!isMobile"
      @input="filters = $event"
    />
    <ModalClosedChatsFilters
      v-if="isMobile && showModalFilters"
      v-model="filters"
      @close="handleShowModalFilters"
    />

    <RoomsTableLoading v-if="isTableLoading" />
    <UnnnicTable
      v-if="!isTableLoading && this.rooms.length > 0"
      :items="rooms"
      class="closed-chats__rooms-table__table"
    >
      <template #header>
        <UnnnicTableRow :headers="tableHeaders" />
      </template>

      <template #item="{ item }">
        <section
          @click="emitOpenRoom(item)"
          @keypress.enter="emitOpenRoom(item)"
        >
          <UnnnicTableRow :headers="tableHeaders">
            <template #contactName>
              <div class="closed-chats__rooms-table__table__contact">
                <UnnnicChatsUserAvatar
                  :username="item.contact.name"
                  v-if="!isMobile"
                />
                <p
                  class="closed-chats__rooms-table__table__contact__name"
                  :title="item.contact.name"
                >
                  {{ item.contact.name }}
                </p>
              </div>
            </template>

            <template #agentName>{{ item.user?.first_name }}</template>

            <template #tags>
              <TagGroup
                :tags="item.tags || []"
                :flex="false"
              />
            </template>

            <template #date>{{ $d(new Date(item.ended_at)) }}</template>

            <template #visualize>
              <div
                v-if="isMobile"
                @click="emitOpenRoom(item)"
                @keypress.enter="emitOpenRoom(item)"
              >
                <UnnnicIcon
                  class="closed-chats__rooms-table__table__visualize-icon"
                  icon="open_in_new"
                />
              </div>
              <UnnnicButton
                v-else
                class="closed-chats__rooms-table__table__visualize-button"
                :text="$t('see')"
                type="secondary"
                size="small"
                @click="
                  $router.push({
                    name: 'closed-rooms.selected',
                    params: { roomId: item.uuid },
                  })
                "
              />
            </template>
          </UnnnicTableRow>
        </section>
      </template>
    </UnnnicTable>
    <p
      v-if="!isTableLoading && this.rooms.length === 0"
      class="closed-chats__rooms-table__table__no-results"
    >
      {{ $t('without_results') }}
    </p>

    <TablePagination
      v-if="showTablePagination"
      v-model="roomsCurrentPage"
      :count="isMobile ? null : roomsCount"
      :countPages="roomsCountPages"
      :limit="roomsLimitPagination"
      :isLoading="isPagesLoading"
    />

    <UnnnicButton
      v-if="isMobile"
      class="closed-chats__rooms-table__table__mobile-filters"
      iconLeft="search"
      :text="$t('search')"
      type="primary"
      size="large"
      @click="handleShowModalFilters"
    />
  </section>
</template>

<script>
import isMobile from 'is-mobile';

import History from '@/services/api/resources/chats/history';

import RoomsTableLoading from '@/views/loadings/ClosedChats/RoomsTableLoading.vue';
import TablePagination from '@/components/TablePagination.vue';
import TagGroup from '@/components/TagGroup.vue';
import ModalClosedChatsFilters from '@/components/chats/Mobile/ModalClosedChatsFilters.vue';

import ClosedChatsRoomsTableFilters from './RoomsTableFilters.vue';

export default {
  name: 'ClosedChatsRoomsTable',

  components: {
    TagGroup,
    ClosedChatsRoomsTableFilters,
    RoomsTableLoading,
    TablePagination,
    ModalClosedChatsFilters,
  },

  data: () => ({
    isMobile: isMobile(),

    isTableLoading: true,
    isPagesLoading: true,
    showModalFilters: false,

    rooms: [],
    roomsCount: 0,
    roomsCountPages: 0,
    roomsCurrentPage: 1,
    roomsLimit: isMobile ? 10 : 5,
    roomsLimitPagination: 5,

    filters: {
      contact: '',
      sector: [],
      tag: [],
      date: null,
    },
  }),

  computed: {
    tableHeaders() {
      const createHeader = (id, text, showInMobile = true) => {
        if (!showInMobile && this.isMobile) {
          return null;
        }

        return {
          id,
          text: this.$t(text),
          flex: 1,
        };
      };

      return [
        createHeader('contactName', 'contact'),
        createHeader('agentName', 'agent', false),
        createHeader('tags', 'tags.title', false),
        createHeader('date', 'date'),
        createHeader('visualize', 'view'),
      ].filter((header) => header !== null);
    },

    showTablePagination() {
      const { isMobile, roomsCountPages } = this;
      return !isMobile || (isMobile && roomsCountPages);
    },
  },

  methods: {
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

    handleShowModalFilters() {
      this.showModalFilters = !this.showModalFilters;
    },
    emitOpenRoom(room) {
      if (this.isMobile) {
        this.$emit('open-room', room);
      }
    },
  },

  watch: {
    roomsCurrentPage() {
      this.getHistoryRooms(true);
    },
    filters: {
      deep: true,
      handler() {
        this.getHistoryRooms();
      },
    },
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

    &.mobile {
      grid-template-rows: 1fr auto auto;

      padding: $unnnic-spacing-sm;

      overflow: hidden;
      :deep(.unnnic-table) {
        .header {
          background-color: $unnnic-color-aux-purple-100;
          .col {
            color: $unnnic-color-neutral-dark;
          }
        }

        .scroll {
          padding-right: 0;

          .item {
            border-radius: 0;
            border-bottom: 1px solid $unnnic-color-neutral-cleanest;
          }
        }
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

      &__visualize-icon {
        display: flex;

        user-select: none;
        cursor: pointer;
      }

      &__visualize-button {
        width: 100%;
      }
    }
  }
}
</style>
