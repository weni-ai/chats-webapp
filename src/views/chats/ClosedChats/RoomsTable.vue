<template>
  <section
    class="closed-chats__rooms-table"
    :class="{ mobile: isMobile }"
    data-testid="rooms-table-section"
  >
    <ClosedChatsRoomsTableFilters
      v-show="!isMobile"
      data-testid="desktop-filters"
      @input="filters = $event"
    />

    <ModalClosedChatsFilters
      v-if="isMobile && showModalFilters"
      v-model="filters"
      data-testid="mobile-filters-modal"
      @close="handleShowModalFilters"
    />

    <UnnnicDataTable
      clickable
      fixedHeaders
      height="100%"
      size="sm"
      :items="rooms"
      :headers="tableHeaders"
      :hidePagination="!showTablePagination"
      :pageInterval="roomsLimit"
      :pageTotal="roomsCount"
      :page="roomsCurrentPage"
      :locale="$i18n.locale"
      :isLoading="isTableLoading"
      @update:page="roomsCurrentPage = $event"
      @item-click="handleOpenRoom"
    >
      <template #body-contactName="{ item }">
        <div class="closed-chats__rooms-table__table__contact">
          <UnnnicChatsUserAvatar
            v-if="!isMobile"
            :username="item.contact.name"
            data-testid="room-item-avatar"
          />
          <p
            class="closed-chats__rooms-table__table__contact__name"
            :title="item.contact.name"
            data-testid="room-item-contact-name"
          >
            {{ item.contact.name }}
          </p>
        </div>
      </template>
      <template #body-agentName="{ item }">
        <span
          v-if="item.user?.first_name || item.user?.last_name"
          data-testid="room-item-agent-name"
        >
          {{ formatAgentName(item.user) }}
        </span>
        <span
          v-else-if="item.user"
          class="italic-label"
        >
          {{ $t('unnamed_agent') }}
        </span>
        <span
          v-else
          class="no-agent-assigned-label italic-label"
          data-testid="room-item-no-agent-assigned"
        >
          {{ $t('no_agent_assigned') }}
        </span>
      </template>
      <template #body-closedBy="{ item }">
        <span
          v-if="item.closed_by?.first_name || item.closed_by?.last_name"
          data-testid="room-item-closed-by"
        >
          {{ formatAgentName(item.closed_by) }}
        </span>
        <span
          v-else-if="item.closed_by"
          class="italic-label"
        >
          {{ $t('unnamed_agent') }}
        </span>
      </template>
      <template #body-tags="{ item }">
        <TagGroup
          v-if="!!item.tags.length"
          class="closed-chats__tags"
          :tags="item.tags || []"
          :flex="false"
          disabledTag
          data-testid="room-item-tags"
        />
        <span
          v-else
          class="no-tags-assigned-label italic-label"
          data-testid="room-item-no-tags-assigned"
        >
          {{ $t('no_tags_assigned') }}
        </span>
      </template>
      <template #body-date="{ item }">
        <span data-testid="room-item-date">
          {{ $d(new Date(item.ended_at)) }}
        </span>
      </template>
    </UnnnicDataTable>

    <UnnnicButton
      v-if="isMobile"
      class="closed-chats__rooms-table__table__mobile-filters"
      iconLeft="search"
      :text="$t('search')"
      type="primary"
      size="large"
      data-testid="mobile-filters-button"
      @click="handleShowModalFilters"
    />
  </section>
</template>

<script>
import isMobile from 'is-mobile';

import History from '@/services/api/resources/chats/history';

import TagGroup from '@/components/TagGroup.vue';
import ModalClosedChatsFilters from '@/components/chats/Mobile/ModalClosedChatsFilters.vue';

import ClosedChatsRoomsTableFilters from './RoomsTableFilters.vue';

export default {
  name: 'ClosedChatsRoomsTable',

  components: {
    TagGroup,
    ClosedChatsRoomsTableFilters,
    ModalClosedChatsFilters,
  },

  emits: ['open-room'],

  data: () => ({
    isMobile: isMobile(),

    isTableLoading: true,
    isPagesLoading: true,
    showModalFilters: false,

    rooms: [],
    roomsCount: 0,
    roomsCountPages: 0,
    roomsCurrentPage: 1,
    roomsLimit: 10,

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
          itemKey: id,
          title: this.$t(text),
        };
      };

      return [
        createHeader('contactName', 'contact'),
        createHeader('agentName', 'agent', false),
        createHeader('closedBy', 'ended_by'),
        createHeader('tags', 'tags.title', false),
        createHeader('date', 'date'),
      ].filter((header) => header !== null);
    },

    showTablePagination() {
      const { isMobile, roomsCountPages } = this;
      return !isMobile || (isMobile && roomsCountPages);
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
          ended_at_before: date?.end,
          ended_at_after: date?.start,
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

    handleOpenRoom(room) {
      if (this.isMobile) {
        this.$emit('open-room', room);
      } else {
        this.$router.push({
          name: 'closed-rooms.selected',
          params: { roomId: room.uuid },
          query: { from: this.$route.query.from },
        });
      }
    },

    formatAgentName(agent) {
      if (!agent.first_name && !agent.last_name) {
        return this.$t('unnamed_agent');
      }
      return `${agent.first_name} ${agent.last_name}`.trim();
    },
  },
};
</script>

<style lang="scss" scoped>
.italic-label {
  font: $unnnic-font-body;
  font-style: italic;
}
:deep(.tag-group__tags) {
  .unnnic-icon {
    display: none;
  }
}
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
    }

    &__table {
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
    }
  }
}
</style>
