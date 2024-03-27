<template>
  <section class="rooms-table-loading">
    <header class="rooms-table-loading__categories">
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
    </header>
    <section
      class="rooms-table-loading__row"
      v-for="row in 4"
      :key="`row-${row}`"
    >
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
      <UnnnicSkeletonLoading />
    </section>
  </section>
</template>

<script>
export default {
  name: 'RoomsTableFiltersLoading',
};
</script>

<style lang="scss" scoped>
.rooms-table-loading {
  display: flex;
  flex-direction: column;

  overflow: hidden auto;

  &__categories,
  &__row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: $unnnic-spacing-sm;

    padding: $unnnic-spacing-ant $unnnic-spacing-sm;

    & > * {
      display: flex;
      height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }
  }

  &__categories {
    margin-bottom: $unnnic-spacing-nano;
  }
}
</style>
