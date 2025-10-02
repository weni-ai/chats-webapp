<template>
  <aside class="aside-slot-template">
    <slot
      v-if="hasHeaderSlot"
      name="header"
    />
    <section :class="['aside-slot-template__sections']">
      <slot />
    </section>
    <slot name="modals" />
  </aside>
</template>

<script>
export default {
  name: 'AsideSlotTemplate',
  computed: {
    hasHeaderSlot() {
      return !!this.$slots.header?.();
    },
  },
};
</script>

<style lang="scss" scoped>
.aside-slot-template {
  position: relative;

  display: flex;
  flex-direction: column;
  height: 100%;

  overflow: hidden;

  &__sections {
    flex: 1 1;
    min-height: 0;
    display: grid;
  }
}
</style>
