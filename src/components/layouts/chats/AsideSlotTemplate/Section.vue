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
  padding: $unnnic-spacing-inset-md $unnnic-spacing-inset-md $unnnic-spacing-inset-sm;
  background: $unnnic-color-background-snow;

  & + .aside-slot-template-section {
    margin-top: $unnnic-spacing-inline-xs;
  }
}
</style>
