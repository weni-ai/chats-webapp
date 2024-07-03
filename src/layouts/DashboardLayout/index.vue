<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <section class="dashboard-layout unnnic-grid-giant">
    <div class="unnnic-grid-span-12">
      <header
        class="dashboard__header"
        style="justify-content: space-between"
      >
        <section class="dashboard__header__container">
          <UnnnicAvatarIcon
            class="dashboard__header__container__icon"
            icon="bar_chart_4_bars"
            scheme="aux-purple"
          />
          <span class="dashboard__header__container__title">
            <slot name="header" />
          </span>
        </section>
        <div style="display: flex; padding: 12px">
          <slot name="status" />
          <div @click="close">
            <UnnnicIcon
              style="cursor: pointer; margin-right: 26px; margin-top: 18px"
              size="sm"
              icon="close-1"
            />
          </div>
        </div>
      </header>

      <section class="actions">
        <slot name="actions" />
      </section>

      <section class="view scrollable">
        <slot />
      </section>
    </div>
  </section>
</template>

<script>
export default {
  name: 'DashboardLayout',

  methods: {
    close() {
      this.$router.replace({ name: 'home' });
    },
  },
};
</script>

<style lang="scss" scoped>
.dashboard-layout {
  $max-height: calc(100vh - 5.5rem);
  min-height: 100%;
  flex-direction: column;

  padding: 1.5rem 0.5rem 0 1.5rem;

  background: $unnnic-color-background-carpet;

  .dashboard__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-right: 1rem;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
    border-bottom: solid 1px $unnnic-color-neutral-soft;
    &__container {
      display: flex;
      gap: 4px;
      align-items: center;
      &__title {
        font-size: 1.5rem;
        color: $unnnic-color-neutral-darkest;
      }
    }
  }

  .actions {
    margin-bottom: 1rem;
  }

  .scrollable {
    overflow-y: auto;
    padding: {
      bottom: $unnnic-spacing-inset-md;
    }
  }

  .view {
    flex: 1 1;
  }
}
</style>
