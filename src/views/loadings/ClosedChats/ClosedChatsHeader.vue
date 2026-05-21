<template>
  <header class="closed-chats-header-loading">
    <UnnnicSkeletonLoading
      class="closed-chats-header-loading__back"
      tag="div"
    />
    <section class="closed-chats-header-loading__content">
      <UnnnicSkeletonLoading
        class="closed-chats-header-loading__title"
        tag="div"
      />
      <UnnnicSkeletonLoading
        class="closed-chats-header-loading__description"
        tag="div"
      />
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
  align-items: center;
  gap: $unnnic-space-4;

  padding-top: $unnnic-space-2;
  padding-bottom: $unnnic-space-6;

  border-bottom: 1px solid $unnnic-color-border-base;

  &__back {
    width: 45px;
    height: 45px;

    :deep(.unnnic-skeleton) {
      width: 100%;
      height: 100%;
    }
  }

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $unnnic-space-2;
    min-width: 0;
  }

  &__title {
    height: $unnnic-font-size-title-md;

    :deep(.unnnic-skeleton) {
      width: 240px;
      height: 100%;
    }
  }

  &__description {
    height: $unnnic-font-size-body-md;

    :deep(.unnnic-skeleton) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
