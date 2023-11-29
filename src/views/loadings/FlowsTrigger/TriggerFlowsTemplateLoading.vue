<template>
  <section class="trigger-flows-template-loading">
    <unnnic-skeleton-loading />
    <unnnic-skeleton-loading />
  </section>
</template>

<script>
export default {
  name: 'RoomsTableFiltersLoading',
};
</script>

<style lang="scss" scoped>
.trigger-flows-template-loading {
  margin-top: $unnnic-spacing-sm;

  display: grid;
  grid-template-rows: ($unnnic-font-size-h4 * 3) $unnnic-font-size-h4;
  gap: $unnnic-spacing-sm;

  width: 100%;

  & > * {
    display: flex;
  }
}
</style>
