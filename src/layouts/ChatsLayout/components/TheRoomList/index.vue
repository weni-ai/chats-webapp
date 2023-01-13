<template>
  <div class="container">
    <section class="chat-groups">
      <room-group v-if="queue.length" :label="$t('line')" :rooms="queue" filled @open="open" />
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
        :label="$t('chats.in_progress')"
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
import { mapGetters } from 'vuex';

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

  async mounted() {
    try {
      await this.$store.dispatch('rooms/getAll');
    } catch {
      console.error('Não foi possível listar as salas');
    }
  },

  computed: {
    ...mapGetters({
      rooms: 'rooms/agentRooms',
      queue: 'rooms/waitingQueue',
      wating: 'rooms/waitingContactAnswer',
    }),
    isHistoryView() {
      return this.$route.name === 'rooms.closed';
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
  }
}
</style>
