<template>
  <section class="table-pagination-loading">
    <unnnic-skeleton-loading class="table-pagination-loading__count" />
    <div class="table-pagination-loading__pagination">
      <unnnic-skeleton-loading v-for="page in 7" :key="`page-${page}`" height="36px" width="36px" />
    </div>
  </section>
</template>

<script>
export default {
  name: 'TablePaginationLoading',
};
</script>

<style lang="scss" scoped>
.table-pagination-loading {
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
