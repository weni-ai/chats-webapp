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

  & + & {
    border-top: solid 1px $unnnic-color-neutral-soft;
  }
}
</style>
