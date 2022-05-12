<template>
  <section class="container">
    <the-chat-list class="chat-list" :disabled="disabledChatList" />

    <main>
      <slot />
    </main>

    <section v-if="areUsingAsideSlot" class="aside">
      <slot name="aside" />
    </section>
  </section>
</template>

<script>
import TheChatList from '@/components/layouts/TheChatList';

export default {
  name: 'MainLayout',

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
    areUsingAsideSlot() {
      return !!this.$slots.aside;
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  $max-height: calc(100vh - 5.5rem);
  display: flex;

  max-height: $max-height;

  .chat-list {
    overflow-y: auto;
    margin: 1rem 0 0 1rem;
  }

  main {
    padding: 1.5rem 0 1rem 1.5rem;
    height: $max-height;
    flex: 1;
  }

  .aside {
    padding: 1.5rem 0 1.5rem 1.5rem;
    height: $max-height;
    background: $unnnic-color-neutral-lightest;
    width: 20.625rem;
  }
}
</style>
