<template>
  <section class="triggered-flows-loading">
    <header class="triggered-flows-loading__categories">
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
    </header>
    <section class="triggered-flows-loading__row" v-for="row in 4" :key="`row-${row}`">
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
    </section>
  </section>
</template>

<script>
export default {
  name: 'TriggeredFlowsLoading',
};
</script>

<style lang="scss" scoped>
.triggered-flows-loading {
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
