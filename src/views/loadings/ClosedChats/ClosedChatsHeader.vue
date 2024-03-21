<template>
  <header class="closed-chats-header-loading">
    <section class="closed-chats-header-loading__topbar">
      <div class="closed-chats-header-loading__topbar__breadcrumbs">
        <UnnnicSkeletonLoading />
        <UnnnicSkeletonLoading />
        <UnnnicSkeletonLoading />
      </div>
      <UnnnicSkeletonLoading />
    </section>
    <section class="closed-chats-header-loading__infos">
      <UnnnicSkeletonLoading tag="div" />
      <section class="closed-chats-header-loading__infos__title">
        <UnnnicSkeletonLoading tag="div" />
        <UnnnicSkeletonLoading tag="div" />
      </section>
    </section>
  </header>
</template>

<script>
export default {
  name: 'ClosedChatsHeaderLoading',
};
</script>

<style lang="scss" scoped>
.closed-chats-header-loading {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-md;

  z-index: 10000;

  padding: $unnnic-spacing-md;

  box-shadow: inset 0 0 -$unnnic-border-width-thinner $unnnic-color-neutral-soft;

  &__topbar {
    display: grid;
    grid-template-columns: auto $unnnic-spacing-md;
    grid-template-rows: $unnnic-spacing-md;

    span {
      width: 100%;
      height: $unnnic-font-size-title-md;
    }

    :deep(.unnnic-skeleton) {
      width: 100%;
      height: $unnnic-font-size-title-md;
    }

    &__breadcrumbs {
      display: grid;
      gap: $unnnic-spacing-xs;
      grid-template-columns: 40px 12px 40px;
    }
  }

  &__infos {
    display: grid;
    gap: $unnnic-spacing-ant;
    grid-template-columns: $unnnic-font-size-h3 auto;
    grid-template-rows: $unnnic-font-size-h3;

    div {
      display: flex;
    }

    :deep(.unnnic-skeleton) {
      width: 100%;
      height: 100%;
    }

    &__title {
      display: grid;
      grid-template-rows: $unnnic-font-size-title-md $unnnic-font-size-title-sm;
      gap: $unnnic-spacing-nano;
    }
  }
}
</style>
