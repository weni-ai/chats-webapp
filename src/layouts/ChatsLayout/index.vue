<template>
  <section class="chats-layout">
    <the-room-list class="room-list" :disabled="disabledChatList" />

    <main>
      <slot />
    </main>

    <section v-if="isAsideSlotInUse" class="aside">
      <slot name="aside" />
    </section>
  </section>
</template>

<script>
import TheRoomList from './components/TheRoomList';

export default {
  name: 'ChatsLayout',

  components: {
    TheRoomList,
  },

  props: {
    disabledChatList: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    isAsideSlotInUse() {
      return !!this.$slots.aside;
    },
  },
};
</script>

<style lang="scss" scoped>
.chats-layout {
  height: 100%;
  max-height: 100%;
  display: flex;

  .room-list {
    overflow-y: auto;
    margin: {
      top: $unnnic-spacing-inline-sm;
      right: 0;
      bottom: 0;
      left: $unnnic-spacing-inline-sm;
    }
  }

  main {
    flex: 1 1;
    height: 100%;
  }

  .aside {
    height: 100%;
    width: 20.625rem;

    background: $unnnic-color-background-grass;
    padding-left: $unnnic-spacing-inline-xs;
  }
}
</style>
