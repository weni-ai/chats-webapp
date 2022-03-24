<template>
  <section class="container">
    <chat-queue class="queue" />

    <main>
      <slot />
    </main>

    <aside>
      <slot name="aside" />
      aside
    </aside>
  </section>
</template>

<script>
import ChatQueue from '@/components/layouts/ChatQueue';

export default {
  name: 'MainLayout',

  components: {
    ChatQueue,
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;

  .queue {
    max-height: calc(100vh - 5.5rem - 1rem);
    overflow-y: auto;
  }

  main {
    flex: 1;
  }

  aside {
    flex-basis: 30%;
  }
}
</style>
