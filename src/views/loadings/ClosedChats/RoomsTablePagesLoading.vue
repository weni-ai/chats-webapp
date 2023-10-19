<template>
  <section class="rooms-table-pages-loading">
    <unnnic-skeleton-loading class="rooms-table-pages-loading__count" />
    <div class="rooms-table-pages-loading__pagination">
      <unnnic-skeleton-loading v-for="page in 7" :key="`page-${page}`" height="36px" width="36px" />
    </div>
  </section>
</template>

<script>
export default {
  name: 'RoomsTablePagesLoading',
};
</script>

<style lang="scss" scoped>
.rooms-table-pages-loading {
  z-index: 10000;

  margin-top: $unnnic-spacing-md;
  border-top: $unnnic-border-width-thinner solid $unnnic-color-neutral-soft;
  padding-top: $unnnic-spacing-md;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $unnnic-spacing-sm;

  &__count {
    height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    width: 84px;
  }

  &__pagination {
    display: flex;
    gap: $unnnic-spacing-xs;
  }
}
</style>
