<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <UnnnicInput
      v-model="nameOfContact"
      iconLeft="search-1"
      :iconRight="nameOfContact ? 'close-1' : ''"
      :iconRightClickable="true"
      @icon-right-click="nameOfContact = ''"
      size="sm"
      :placeholder="$t('chats.search_contact')"
    ></UnnnicInput>
    <div class="order-by">
      <div>
        <span>{{ $t('chats.room_list.order_by') }}</span>
      </div>
      <div
        class="apply-filter"
        style="cursor: pointer"
      >
        <span
          :style="{
            fontWeight: lastCreatedFilter ? '700' : '400',
          }"
          @click="
            listRoom(false, '-last_interaction'),
              ((lastCreatedFilter = true), (createdOnFilter = false))
          "
          >{{ $t('chats.room_list.most_recent') }}</span
        >
        <span> | </span>
        <span
          :style="{
            fontWeight: createdOnFilter ? '700' : '400',
          }"
          @click="
            listRoom(false, 'last_interaction'),
              ((createdOnFilter = true), (lastCreatedFilter = false))
          "
        >
          {{ $t('chats.room_list.older') }}</span
        >
      </div>
    </div>

    <RoomsListLoading v-if="isLoadingRooms" />
    <section
      v-else
      class="chat-groups"
      @scroll="
        (event) => {
          handleScroll(event.srcElement);
        }
      "
    >
      <CardGroup
        v-if="discussions.length"
        :label="$t('chats.discussions', { length: discussions.length })"
        :discussions="discussions"
        @open="openDiscussion"
      />
      <CardGroup
        v-if="rooms_queue.length"
        :label="$t('chats.waiting', { length: rooms_queue.length })"
        :rooms="rooms_queue"
        @open="openRoom"
      />
      <CardGroup
        v-if="rooms.length"
        :label="$t('chats.in_progress', { length: rooms.length })"
        :rooms="rooms"
        @open="openRoom"
        :withSelection="project.config.can_use_bulk_transfer"
      />
      <CardGroup
        v-if="rooms_sent_flows.length"
        :label="$t('chats.sent_flows', { length: rooms_sent_flows.length })"
        :rooms="rooms_sent_flows"
        @open="openRoom"
      />
      <p
        v-if="showNoResultsError"
        class="no-results"
      >
        {{ isSearching ? $t('without_results') : $t('without_chats') }}
      </p>
    </section>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import RoomsListLoading from '@/views/loadings/RoomsList.vue';
import CardGroup from './CardGroup';

export default {
  name: 'TheCardGroups',

  components: {
    RoomsListLoading,
    CardGroup,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    isViewMode: {
      type: Boolean,
      default: false,
    },
    viewedAgent: {
      type: String,
    },
  },
  data: () => ({
    page: 0,
    limit: 100,
    nameOfContact: '',
    timerId: 0,
    isLoadingRooms: true,
    createdOnFilter: false,
    lastCreatedFilter: true,
    isSearching: false,
  }),

  async mounted() {
    this.listRoom();
    this.listDiscussions();
  },

  computed: {
    ...mapGetters({
      rooms: 'chats/rooms/agentRooms',
      rooms_queue: 'chats/rooms/waitingQueue',
      rooms_sent_flows: 'chats/rooms/waitingContactAnswer',
    }),
    ...mapState({
      discussions: (state) => state.chats.discussions.discussions,
      listRoomHasNext: (state) => state.chats.rooms.listRoomHasNext,
      project: (state) => state.config.project,
    }),

    totalUnreadMessages() {
      return this.rooms.reduce(
        (total, room) =>
          total +
          (this.$store.state.chats.rooms.newMessagesByRoom[room.uuid]?.messages
            ?.length || 0),
        0,
      );
    },

    showNoResultsError() {
      return (
        !this.isLoadingRooms &&
        this.rooms.length === 0 &&
        this.rooms_queue.length === 0 &&
        this.rooms_sent_flows.length === 0 &&
        this.discussions.length === 0
      );
    },
  },

  watch: {
    totalUnreadMessages: {
      immediate: true,
      handler() {
        window.parent.postMessage(
          {
            event: 'chats:update-unread-messages',
            unreadMessages: this.totalUnreadMessages,
          },
          '*',
        );
      },
    },
    nameOfContact: {
      handler(newNameOfContact) {
        const TIME_TO_WAIT_TYPING = 1300;

        if (this.timerId !== 0) clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
          this.listRoom(false);

          if (newNameOfContact) {
            this.isSearching = true;
          } else {
            this.isSearching = false;
          }
        }, TIME_TO_WAIT_TYPING);
      },
    },
  },

  methods: {
    async openRoom(room) {
      await this.$store.dispatch('chats/discussions/setActiveDiscussion', null);
      await this.$store.dispatch('chats/rooms/setActiveRoom', room);
    },

    async openDiscussion(discussion) {
      await this.$store.dispatch(
        'chats/discussions/setActiveDiscussion',
        discussion,
      );
    },

    clearField() {
      this.nameOfContact = '';
    },

    async listRoom(concat, order = '-last_interaction') {
      this.isLoadingRooms = true;
      const { viewedAgent } = this;
      try {
        await this.$store.dispatch('chats/rooms/getAll', {
          offset: this.page * this.limit,
          concat,
          order,
          limit: this.limit,
          contact: this.nameOfContact,
          viewedAgent,
        });
        this.isLoadingRooms = false;
      } catch {
        this.isLoadingRooms = false;
        console.error('Não foi possível listar as salas');
      }
    },
    searchForMoreRooms() {
      if (this.listRoomHasNext) {
        this.page += 1;
        this.listRoom(true);
      }
    },
    async listDiscussions() {
      try {
        const { viewedAgent } = this;
        await this.$store.dispatch('chats/discussions/getAll', { viewedAgent });
      } catch {
        console.error('Não foi possível listar as discussões');
      }
    },
    handleScroll(target) {
      if (
        target.offsetHeight + Math.ceil(target.scrollTop) >=
        target.scrollHeight
      ) {
        this.searchForMoreRooms(true);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;

  .chat-groups {
    flex: 1 1;

    display: flex;
    flex-direction: column;

    margin-top: $unnnic-spacing-sm;
    padding-right: $unnnic-spacing-xs;
    margin-right: -$unnnic-spacing-xs; // For the scrollbar to stick to the edge
    overflow-y: auto;
    overflow-x: hidden;

    :deep(.unnnic-collapse) {
      padding-bottom: $unnnic-spacing-sm;
    }

    .no-results {
      color: $unnnic-color-neutral-cloudy;
      font-size: $unnnic-font-size-body-gt;
    }
  }

  .order-by {
    display: flex;
    justify-content: space-between;

    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
  }
}
</style>
