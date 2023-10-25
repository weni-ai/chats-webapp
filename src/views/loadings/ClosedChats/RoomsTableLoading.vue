<template>
  <section class="rooms-table-loading">
    <header class="rooms-table-loading__categories">
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
    </header>
    <section class="rooms-table-loading__row" v-for="row in 4" :key="`row-${row}`">
      <div class="rooms-table-loading__contact-info">
        <unnnic-skeleton-loading height="40px" />
        <unnnic-skeleton-loading />
      </div>
      <unnnic-skeleton-loading class="rooms-table-loading__agent" />
      <div class="rooms-table-loading__tags">
        <unnnic-skeleton-loading />
        <unnnic-skeleton-loading />
        <unnnic-skeleton-loading />
      </div>
      <unnnic-skeleton-loading class="rooms-table-loading__date" />
      <unnnic-skeleton-loading class="rooms-table-loading__show" />
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
  }

  &__row {
    display: grid;
    align-items: center;

    padding: 12px 16px;
  }

  &__categories {
    padding: $unnnic-spacing-ant $unnnic-spacing-sm;
    margin-bottom: $unnnic-spacing-nano;

    & > * {
      height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }
  }

  &__contact-info {
    display: grid;
    grid-template-columns: 40px auto;
    gap: $unnnic-spacing-nano;
    align-items: center;
  }

  &__tags {
    display: grid;
    grid-template-columns: 2fr 1fr 2fr;
    gap: $unnnic-spacing-xs;

    & > * {
      height: 40px;
    }
  }

  &__show {
    height: 38px;
  }
}
</style>
