<template>
  <section class="container">
    <the-chat-list class="chat-list" :disabled="disabledChatList" />

    <main>
      <slot />
    </main>

    <section v-if="isAsideSlotInUse" class="aside">
      <slot name="aside" />
    </section>
  </section>
</template>

<script>
import TheChatList from './components/TheChatList';

export default {
  name: 'ChatsLayout',

  components: {
    TheChatList,
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

  .chat-list {
    overflow-y: auto;
    margin: {
      top: $unnnic-spacing-inline-sm;
      right: 0;
      bottom: 0;
      left: $unnnic-spacing-inline-sm;
    }
  }

  main {
    flex: 1;
    height: $max-height;
    padding: {
      top: $unnnic-spacing-inset-md;
      right: 0;
      bottom: $unnnic-spacing-inset-sm;
      left: $unnnic-spacing-inset-md;
    }
  }

  .aside {
    height: $max-height;
    background: $unnnic-color-neutral-lightest;
    width: 20.625rem;
    background: $unnnic-color-background-grass;
  }
}
</style>
