<template>
  <section class="rooms-table-filters-loading">
    <div class="rooms-table-filters-loading__filter" v-for="filter in 4" :key="`filter-${filter}`">
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
    </div>
    <unnnic-skeleton-loading class="rooms-table-filters-loading__clear" />
  </section>
</template>

<script>
export default {
  name: 'RoomsTableFiltersLoading',
};
</script>

<style lang="scss" scoped>
.rooms-table-filters-loading {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;

  gap: $unnnic-spacing-sm;
  justify-content: space-between;
  align-items: flex-end;

  z-index: 10000;

  &__filter {
    display: grid;
    grid-template-rows: 22px 46px;
    gap: $unnnic-spacing-nano;

    & > * {
      height: 100%;
    }
  }

  &__clear {
    height: 46px;
    width: 74px;
  }
}
</style>
