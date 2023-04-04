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
      style="margin-bottom: 1rem"
      :loading="this.loading"
    ></unnnic-input>
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
        :label="$t('line', { length: queue.length })"
        :rooms="queue"
        filled
        @open="open"
      />
      <room-group
        v-if="wating.length"
        :label="$t('chats.wating_answer', { length: wating.length })"
        :rooms="wating"
        @open="open"
        :isWatingAnswer="true"
        :isHistory="isHistoryView"
      />
      <room-group
        v-bind:style="isHistoryView ? 'opacity: 0.5;' : 'opacity: 20'"
        v-if="rooms.length"
        :label="$t('chats.in_progress', { length: rooms.length })"
        :rooms="rooms"
        @open="open"
        :isHistory="isHistoryView"
      />
    </section>

    <unnnic-button
      :text="isHistoryView ? $t('back_to_chats') : $t('chats.see_history')"
      :iconLeft="isHistoryView ? 'keyboard-arrow-left-1' : 'task-list-clock-1'"
      type="secondary"
      size="small"
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
  },
  data: () => ({
    page: 0,
    limit: 100,
    nameOfContact: '',
    timerId: 0,
    loading: false,
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
      hasNext: (state) => state.rooms.hasNext,
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
    open(room) {
      const path = `/chats/${room.uuid}`;

      if (this.$route.path === path) return;

      this.$router.replace(path);
    },

    clearField() {
      console.log(`oi`);
      this.nameOfContact = '';
    },

    async listRoom(concat) {
      this.loading = true;
      try {
        await this.$store.dispatch('rooms/getAll', {
          offset: this.page * this.limit,
          concat,
          limit: this.limit,
          contact: this.nameOfContact,
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
  gap: $unnnic-spacing-stack-xs;
  padding-bottom: $unnnic-spacing-inset-nano;

  .chat-groups {
    flex: 1 1;

    // width: calc(16rem + 1rem);

    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-md;

    padding-right: $unnnic-spacing-inset-sm;
    border-right: solid 1px $unnnic-color-neutral-soft;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>
