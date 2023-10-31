<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <unnnic-input
      v-model="nameOfContact"
      icon-left="search-1"
      :icon-right="nameOfContact ? 'close-1' : ''"
      :iconRightClickable="true"
      @icon-right-click="nameOfContact = ''"
      size="sm"
      :placeholder="$t('chats.search_contact')"
    ></unnnic-input>
    <div class="order-by">
      <div>
        <span>{{ $t('chats.room_list.order_by') }}</span>
      </div>
      <div class="apply-filter" style="cursor: pointer">
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

    <rooms-list-loading v-if="isLoadingRooms" />
    <section
      v-else
      class="chat-groups"
      @scroll="
        (event) => {
          handleScroll(event.srcElement);
        }
      "
    >
      <card-group
        v-if="discussions.length"
        :label="$t('chats.discussions', { length: discussions.length })"
        :discussions="discussions"
        @open="openDiscussion"
      />
      <card-group
        v-if="rooms_queue.length"
        :label="$t('chats.waiting', { length: rooms_queue.length })"
        :rooms="rooms_queue"
        @open="openRoom"
      />
      <card-group
        v-if="rooms.length"
        :label="$t('chats.in_progress', { length: rooms.length })"
        :rooms="rooms"
        @open="openRoom"
      />
      <card-group
        v-if="rooms_sent_flows.length"
        :label="$t('chats.sent_flows', { length: rooms_sent_flows.length })"
        :rooms="rooms_sent_flows"
        @open="openRoom"
      />
      <p v-if="showNoResultsError" class="no-results">
        {{ $t('without_results') }}
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
    }),

    totalUnreadMessages() {
      return this.rooms.reduce(
        (total, room) =>
          total +
          (this.$store.state.chats.rooms.newMessagesByRoom[room.uuid]?.messages?.length || 0),
        0,
      );
    },

    showNoResultsError() {
      return (
        !this.isLoadingRooms &&
        this.rooms.length === 0 &&
        this.rooms_queue.length === 0 &&
        this.rooms_sent_flows.length === 0
      );
    },
  },

  watch: {
    totalUnreadMessages: {
      immediate: true,
      handler() {
        window.parent.postMessage(
          { event: 'chats:update-unread-messages', unreadMessages: this.totalUnreadMessages },
          '*',
        );
      },
    },
    nameOfContact: {
      handler() {
        if (this.timerId !== 0) clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
          this.listRoom(false);
        }, 800);
      },
    },
  },

  methods: {
    async openRoom(room) {
      if (this.isViewMode) {
        await this.$store.dispatch('chats/rooms/setActiveRoom', room);
      } else {
        const path = `/chats/${room.uuid}`;

        if (this.$route.path === path) return;

        this.$router.replace(path);
      }
    },

    async openDiscussion(discussion) {
      await this.$store.dispatch('chats/discussions/setActiveDiscussion', discussion);
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
        await this.$store.dispatch('chats/discussions/getAll');
      } catch {
        console.error('Não foi possível listar as discussões');
      }
    },
    handleScroll(target) {
      if (target.offsetHeight + Math.ceil(target.scrollTop) >= target.scrollHeight) {
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