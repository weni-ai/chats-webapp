<template>
  <section class="container">
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
.container {
  $max-height: calc(100vh - 5.5rem);
  max-height: $max-height;
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
    height: $max-height;
  }

  .aside {
    height: $max-height;
    max-height: $max-height;
    width: 20.625rem;

    background: $unnnic-color-background-grass;
    padding-left: $unnnic-spacing-inline-xs;

    & > * {
      max-height: $max-height;
    }
  }
}
</style>
