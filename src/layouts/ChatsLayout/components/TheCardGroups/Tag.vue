<template>
  <section
    :class="{ 'filter-tag': true, 'filter-tag--active': active, clickable }"
    @click.stop="$emit('click', label)"
  >
    <p class="filter-tag__label">
      {{ label }}
      {{ count ? `(${count})` : '' }}
    </p>
  </section>
</template>

<script>
export default {
  name: 'FilterTag',
  props: {
    label: {
      type: String,
      default: '',
    },
    count: {
      type: Number,
      default: 0,
    },
    active: { type: Boolean, default: false },
    clickable: { type: Boolean, default: true },
  },
  emits: ['click'],
};
</script>

<style lang="scss">
.clickable {
  cursor: pointer;
}
.filter-tag {
  padding: $unnnic-spacing-nano $unnnic-spacing-xs;
  background-color: $unnnic-color-neutral-light;
  border-radius: 600px;

  :hover {
    color: $unnnic-color-weni-700;
  }

  &__label {
    color: $unnnic-color-neutral-cloudy;
    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-md;
    line-height: $unnnic-font-size-body-md + $unnnic-font-size-body-sm;
  }

  &--active {
    background-color: white;
    border: 1px solid $unnnic-color-weni-700;
    .filter-tag__label {
      color: $unnnic-color-weni-700;
    }
  }

  &__label {
    text-align: center;
  }
}
</style>
