<template>
  <section
    class="rooms-table-filters-loading"
    :class="{ 'rooms-table-filters-loading--vertically': vertically }"
  >
    <div
      v-for="filter in 4"
      :key="`filter-${filter}`"
      class="rooms-table-filters-loading__filter"
    >
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
    </div>
    <UnnnicSkeletonLoading class="rooms-table-filters-loading__clear" />
  </section>
</template>

<script>
export default {
  name: 'RoomsTableFiltersLoading',

  props: {
    vertically: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss" scoped>
.rooms-table-filters-loading {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;

  gap: $unnnic-spacing-sm;
  justify-content: space-between;
  align-items: flex-end;

  overflow: hidden;

  &--vertically {
    grid-template-columns: auto;
    justify-content: stretch;

    .rooms-table-filters-loading__clear {
      width: 100%;
    }
  }

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
