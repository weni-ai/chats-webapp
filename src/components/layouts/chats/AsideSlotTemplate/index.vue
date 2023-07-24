<template>
  <aside class="aside-slot-template">
    <header class="aside-slot-template__header">
      <span class="aside-slot-template__title">
        <span v-if="icon">
          <unnnic-icon-svg :icon="icon" size="ant" scheme="neutral-darkest" />
        </span>
        <span>
          {{ title }}
        </span>
      </span>

      <span
        v-if="!noIconAction"
        @click="$emit('action')"
        @keypress.enter="$emit('action')"
        class="clickable"
      >
        <unnnic-icon-svg :icon="iconAction" size="sm" scheme="neutral-dark" />
      </span>
    </header>

    <section class="aside-slot-template__sections">
      <slot />
    </section>
  </aside>
</template>

<script>
export default {
  name: 'AsideSlotTemplate',
  props: {
    icon: {
      type: String,
      default: '',
    },
    iconAction: {
      type: String,
      default: 'close-1',
    },
    noIconAction: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.aside-slot-template {
  display: flex;
  flex-direction: column;
  height: inherit;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    background: $unnnic-color-background-snow;
    border-bottom: solid 1px $unnnic-color-neutral-soft;

    padding: {
      top: $unnnic-spacing-inset-sm;
      right: $unnnic-spacing-inset-sm;
      bottom: $unnnic-spacing-inset-sm;
      left: $unnnic-spacing-inset-md;
    }
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-nano;

    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-bold;
  }

  &__sections {
    flex: 1 1;
    min-height: 0;
  }
}
</style>
