<template>
  <div class="discussion-sidebar-loading">
    <header>
      <UnnnicSkeletonLoading tag="div" />
    </header>
    <main>
      <UnnnicSkeletonLoading
        v-for="item in 5"
        :key="`item-${item}`"
      />
      <UnnnicSkeletonLoading class="item-last" />
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
