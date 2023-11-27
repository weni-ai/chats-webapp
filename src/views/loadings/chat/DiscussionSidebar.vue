<template>
  <div class="discussion-sidebar-loading">
    <header>
      <unnnic-skeleton-loading tag="div" />
    </header>
    <main>
      <unnnic-skeleton-loading v-for="item in 5" :key="`item-${item}`" />
      <unnnic-skeleton-loading class="item-last" />
    </main>
  </div>
</template>

<script>
export default {
  name: 'DiscussionSidebarLoading',
};
</script>

<style lang="scss" scoped>
.discussion-sidebar-loading {
  display: flex;
  flex-direction: column;

  background-color: $unnnic-color-neutral-white;

  width: 100%;
  height: 100%;

  > header {
    padding: $unnnic-spacing-sm;

    box-shadow: $unnnic-shadow-level-far;

    & > * {
      width: 100%;
      height: 40px;
    }
  }
  main {
    display: grid;
    gap: $unnnic-spacing-sm;

    padding: $unnnic-spacing-xs;

    & > * {
      width: 100%;
      height: 20px;
    }

    .item-last {
      width: 100%;
      height: 40px;
    }
  }
}
</style>
