<template>
  <section class="dashboard-layout">
    <header class="dashboard__header">
      <unnnic-avatar-icon icon="graph-stats-1" scheme="aux-purple" />
      <span class="title">
        <slot name="header" />
      </span>
      <unnnic-icon-svg icon="information-circle-4" size="sm" scheme="neutral-soft" />
    </header>

    <section class="actions">
      <slot name="actions" />
    </section>

    <section class="view scrollable">
      <slot />
    </section>
  </section>
</template>

<script>
export default {
  name: 'DashboardLayout',
};
</script>

<style lang="scss" scoped>
.dashboard-layout {
  $max-height: calc(100vh - 5.5rem);
  height: $max-height;
  max-height: $max-height;

  display: flex;
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

    .title {
      font-size: 1.5rem;
      color: $unnnic-color-neutral-darkest;
    }
  }

  .actions {
    margin-bottom: 1rem;
  }

  .scrollable {
    overflow-y: auto;
    padding: {
      right: $unnnic-spacing-inset-sm;
      bottom: $unnnic-spacing-inset-md;
    }
  }

  .view {
    flex: 1 1;
  }
}
</style>
