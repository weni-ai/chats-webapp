<template>
  <div
    class="fullscreen-control"
    :class="{ 'fullscreen-control--disabled': disabled }"
    @click.stop="handleClick"
    @keypress.enter="handleClick"
  >
    <UnnnicIcon
      :icon="icon"
      scheme="neutral-snow"
      data-testid="control-icon"
      :size="size"
    />
  </div>
</template>
<script>
export default {
  name: 'FullscreenControl',
  props: {
    icon: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      default: 'md',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  methods: {
    handleClick() {
      if (!this.disabled) {
        this.$emit('click');
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.fullscreen-control {
  display: flex;

  user-select: none;
  cursor: pointer;

  &--disabled {
    cursor: not-allowed;
    opacity: $unnnic-opacity-level-dark;
    pointer-events: none;
  }
}
</style>
