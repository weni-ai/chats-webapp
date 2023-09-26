<template>
  <div class="home-sidebar-loading">
    <header>
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading height="24px" />
    </header>
    <section class="home-sidebar-loading__actions">
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
      <div class="home-sidebar-loading__actions__order-by">
        <unnnic-skeleton-loading width="73px" />
        <div class="home-sidebar-loading__actions__order-by__options">
          <unnnic-skeleton-loading height="15px" />
          <unnnic-skeleton-loading height="15px" />
        </div>
      </div>
    </section>
    <rooms-list-loading />
    <footer>
      <unnnic-skeleton-loading />
    </footer>
  </div>
</template>

<script>
import RoomsListLoading from './RoomsList.vue';

export default {
  name: 'HomeSidebarLoading',
  components: {
    RoomsListLoading,
  },
};
</script>

<style lang="scss" scoped>
.home-sidebar-loading {
  padding: $unnnic-spacing-xs;

  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;

  z-index: 10000;

  header {
    padding: $unnnic-spacing-sm 0;

    display: grid;
    gap: $unnnic-spacing-xs;
    grid-template-columns: auto 24px;

    & > * {
      width: 100%;
      height: 24px;
    }
  }

  &__actions {
    margin: $unnnic-spacing-xs 0;
    display: grid;
    gap: $unnnic-spacing-xs;
    grid-template-rows: 38px 36px 16px;

    & > * {
      display: flex;
      width: 100%;
      height: 100%;
    }

    &__order-by {
      height: 15px;

      display: flex;

      & > * {
        width: 100%;
        height: 15px;

        display: flex;
      }

      &__options {
        display: flex;
        gap: $unnnic-spacing-xs;
        & > * {
          width: 75px;

          display: flex;
        }
      }
    }
  }

  footer {
    & > * {
      width: 100%;
      height: 38px;
    }
  }
}
</style>
