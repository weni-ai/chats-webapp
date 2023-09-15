<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <unnnic-input
      v-model="nameOfContact"
      icon-left="search-1"
      icon-right="close-1"
      :iconRightClickable="true"
      @icon-right-click="nameOfContact = ''"
      size="sm"
      placeholder="Pesquisar contato"
      :loading="this.loading"
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
    <section
      class="chat-groups"
      @scroll="
        (event) => {
          handleScroll(event.srcElement);
        }
      "
    >
      <room-group
        v-if="queue.length"
        :label="$t('chats.waiting', { length: queue.length })"
        :rooms="queue"
        filled
        @open="open"
        id="queue"
      />
      <room-group
        v-if="wating.length"
        :label="$t('chats.wating_answer', { length: wating.length })"
        :rooms="wating"
        @open="open"
        id="wating"
      />
      <room-group
        v-bind:style="isHistoryView ? 'opacity: 0.5;' : 'opacity: 20'"
        v-if="rooms.length"
        :label="$t('chats.in_progress', { length: rooms.length })"
        :rooms="rooms"
        @open="open"
        id="in_progress"
      />
    </section>

    <unnnic-button-next
      :text="isHistoryView ? $t('back_to_chats') : $t('chats.see_history')"
      :iconLeft="isHistoryView ? 'keyboard-arrow-left-1' : 'task-list-clock-1'"
      type="terciary"
      size="small"
      :disabled="isViewMode"
      @click="navigate(isHistoryView ? 'home' : 'rooms.closed')"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import RoomGroup from './RoomGroup';

export default {
  name: 'TheRoomList',

  components: {
    RoomGroup,
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
    loading: false,
    createdOnFilter: false,
    lastCreatedFilter: true,
  }),

  async mounted() {
    this.listRoom();
  },

  computed: {
    ...mapGetters({
      rooms: 'rooms/agentRooms',
      queue: 'rooms/waitingQueue',
      wating: 'rooms/waitingContactAnswer',
    }),
    ...mapState({
      listRoomHasNext: (state) => state.rooms.listRoomHasNext,
    }),
    isHistoryView() {
      return this.$route.name === 'rooms.closed';
    },

    totalUnreadMessages() {
      return this.rooms.reduce(
        (total, room) =>
          total + (this.$store.state.rooms.newMessagesByRoom[room.uuid]?.messages?.length || 0),
        0,
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
        }, 1000);
      },
    },
  },

  methods: {
    navigate(name) {
      this.$router.push({
        name,
      });
    },
    async open(room) {
      if (this.isViewMode) {
        await this.$store.dispatch('rooms/setActiveRoom', room);
      } else {
        const path = `/chats/${room.uuid}`;

        if (this.$route.path === path) return;

        this.$router.replace(path);
      }
    },

    clearField() {
      this.nameOfContact = '';
    },

    async listRoom(concat, order = '-last_interaction') {
      this.loading = true;
      const { viewedAgent } = this;
      try {
        await this.$store.dispatch('rooms/getAll', {
          offset: this.page * this.limit,
          concat,
          order,
          limit: this.limit,
          contact: this.nameOfContact,
          viewedAgent,
        });
        this.loading = false;
      } catch {
        this.loading = false;
        console.error('Não foi possível listar as salas');
      }
    },
    searchForMoreRooms() {
      if (this.listRoomHasNext) {
        this.page += 1;
        this.listRoom(true);
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
  gap: $unnnic-spacing-stack-sm;

  .chat-groups {
    flex: 1 1;

    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;

    padding-right: $unnnic-spacing-xs;
    margin-right: -$unnnic-spacing-xs; // For the scrollbar to stick to the edge
    overflow-y: auto;
    overflow-x: hidden;
  }

  .order-by {
    display: flex;
    justify-content: space-between;

    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
  }
}
</style>
