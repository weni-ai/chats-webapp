<template>
  <div class="container">
    <section class="chat-groups">
      <room-group :label="$t('line')" :rooms="queue" filled />
      <room-group :label="$t('chats.in_progress')" :rooms="rooms" />
    </section>

    <unnnic-button
      :text="isActiveChatView ? $t('chats.see_history') : $t('back_to_chats')"
      :iconRight="isActiveChatView ? 'task-list-clock-1' : ''"
      :iconLeft="isActiveChatView ? '' : 'keyboard-arrow-left-1'"
      type="secondary"
      size="small"
      @click="$router.push(isActiveChatView ? '/closed-chats' : '/')"
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

  async mounted() {
    try {
      await this.$store.dispatch('rooms/getAll');
    } catch {
      console.error('Não foi possível listar as salas');
    }
  },

  computed: {
    ...mapState({
      chatGroups: (state) => state.chats.chats,
    }),
    ...mapGetters({
      rooms: 'rooms/agentRooms',
      queue: 'rooms/waitingQueue',
    }),
    isActiveChatView() {
      return ['home', 'chat'].includes(this.$route.name);
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;
  padding-bottom: $unnnic-spacing-inset-nano;

  .chat-groups {
    flex: 1 1;

    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-md;

    padding-right: $unnnic-spacing-inset-sm;
    border-right: solid 1px $unnnic-color-neutral-soft;
    overflow-y: auto;
  }
}
</style>
