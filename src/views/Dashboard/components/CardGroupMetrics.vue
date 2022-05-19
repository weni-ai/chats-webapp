<template>
  <section class="card-group-metrics">
    <p class="title">
      <unnnic-avatar-icon :icon="icon" size="xs" :scheme="scheme" />
      <span> {{ title }} </span>
    </p>

    <section class="card-group-metrics__metrics" :class="[`columns-${columns}`]">
      <unnnic-card-project
        v-for="metric in metrics"
        :key="metric.id"
        :name="metric.name"
        :statuses="metric.statuses"
      />
    </section>
  </section>
</template>

<script>
export default {
  props: {
    columns: {
      type: String,
      default: '2',
      validator: (v) => ['2', '3'].includes(v),
    },
    icon: {
      type: String,
      default: '',
    },
    metrics: {
      type: Array,
      default: () => [],
    },
    scheme: {
      type: String,
      default: 'aux-blue',
    },
    title: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
.card-group-metrics {
  background: $unnnic-color-background-snow;
  padding: $unnnic-spacing-inset-sm;
  border-radius: $unnnic-border-radius-sm;

  .title {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-xs;
    font-size: $unnnic-font-size-title-sm;
    color: $unnnic-color-neutral-darkest;
    margin-bottom: $unnnic-spacing-inline-sm;
  }

  &__metrics {
    display: grid;
    gap: $unnnic-spacing-stack-sm;

    &.columns-2 {
      grid-template-columns: 1fr 1fr;
    }

    &.columns-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
}
</style>
