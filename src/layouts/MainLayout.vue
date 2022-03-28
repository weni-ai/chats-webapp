<template>
  <section class="container">
    <chat-queue class="queue" />

    <main>
      <slot />
    </main>

    <section v-if="areUsingAsideSlot" class="aside">
      <slot name="aside" />
    </section>
  </section>
</template>

<script>
import ChatQueue from '@/components/layouts/ChatQueue';

export default {
  name: 'MainLayout',

  components: {
    ChatQueue,
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

  .queue {
    overflow-y: auto;
    padding-right: 0.5rem;
    margin: 1.5rem 0 0 1.5rem;
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
