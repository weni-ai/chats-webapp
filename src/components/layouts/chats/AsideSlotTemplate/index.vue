<template>
  <aside class="aside-slot-template">
    <header class="header">
      <span class="title">
        {{ title }}
      </span>

      <span @click="$emit('close')" @keypress.enter="$emit('close')" class="clickable">
        <unnnic-icon-svg icon="close-1" size="sm" class="close-icon" scheme="neutral-dark" />
      </span>
    </header>

    <slot />
  </aside>
</template>

<script>
export default {
  name: 'AsideSlotTemplate',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.aside-slot-template {
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    background: $unnnic-color-background-snow;
    border-bottom: solid 1px $unnnic-color-neutral-soft;

    padding: {
      top: $unnnic-spacing-inset-sm;
      right: $unnnic-spacing-inset-nano;
      bottom: $unnnic-spacing-inset-sm;
      left: $unnnic-spacing-inset-md;
    }

    .title {
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      font-weight: $unnnic-font-weight-bold;
    }
  }
}
</style>
