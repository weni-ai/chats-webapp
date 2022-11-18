<template>
  <section class="aside-slot-template-section">
    <slot />
  </section>
</template>

<script>
export default {
  name: 'AsideSlotTemplateSection',
};
</script>

<style lang="scss" scoped>
.aside-slot-template-section {
  background: $unnnic-color-background-snow;
  padding: $unnnic-spacing-inset-md $unnnic-spacing-inset-md;

  &:first-child {
    padding-top: $unnnic-spacing-inset-md;
  }

  &:last-child {
    padding-bottom: $unnnic-spacing-inset-md;
  }

  & + .aside-slot-template-section {
    border-top: solid 1px $unnnic-color-neutral-soft;
  }
}
</style>
