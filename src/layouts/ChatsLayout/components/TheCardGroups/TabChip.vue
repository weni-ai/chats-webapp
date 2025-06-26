<template>
  <section :class="['tab-chip', { 'tab-chip--active': active }]">
    <p :class="['tab-chip__text', { 'tab-chip__text--active': active }]">
      {{ label }}
    </p>
    <section
      v-if="!!count"
      class="tab-chip__count"
    >
      <p
        :class="[
          'tab-chip__count-text',
          { 'tab-chip__count-text--active': active },
        ]"
      >
        {{ count > 99 ? '99+' : count }}
      </p>
      <span
        v-if="showDot"
        class="tab-chip__dot"
      />
    </section>
  </section>
</template>

<script>
export default {
  name: 'TabChip',
  props: {
    label: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    showDot: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped lang="scss">
.tab-chip {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: $unnnic-spacing-nano $unnnic-spacing-xs;
  gap: $unnnic-spacing-nano;
  border-radius: $unnnic-border-radius-pill;
  background-color: $unnnic-color-background-lightest;
  transition: background-color 0.2s ease;

  &--active {
    background-color: $unnnic-color-background-solo;
  }

  &:hover {
    background-color: $unnnic-color-background-sky;
  }

  &__text {
    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
    line-height: $unnnic-font-size-body-md + $unnnic-font-size-body-sm;
    font-weight: $unnnic-font-weight-regular;

    &--active {
      color: $unnnic-color-weni-800;
      font-weight: $unnnic-font-weight-bold;
    }
  }

  &__count {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    border-radius: $unnnic-border-radius-pill;
    padding: 2px;
    min-width: 20px;
    min-height: 20px;
    &-text {
      font-family: $unnnic-font-family-secondary;
      font-weight: $unnnic-font-weight-bold;
      font-size: 10px;
      line-height: $unnnic-line-height-large;
      color: $unnnic-color-neutral-cloudy;

      &--active {
        color: $unnnic-color-weni-800;
      }
    }
    .tab-chip__dot {
      position: absolute;
      width: 5px;
      height: 5px;
      background-color: $unnnic-color-weni-600;
      border-radius: 50%;
      display: inline-block;
      margin-left: 15px;
      margin-bottom: 12px;
    }
  }
}
</style>
