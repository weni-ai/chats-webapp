<template>
  <div
    class="fullscreen-control"
    @click.stop="$emit('click')"
    @keypress.enter="$emit('click')"
  >
    <UnnnicIcon
      :icon="icon"
      scheme="neutral-snow"
      data-testid="control-icon"
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
  },
  emits: ['click'],
};
</script>
<style lang="scss" scoped>
.fullscreen-control {
  display: flex;

  user-select: none;
  cursor: pointer;
}
</style>
