<template>
  <div
    class="fullscreen-control"
    @click="$emit('click')"
    @keypress.enter="$emit('click')"
  >
    <UnnnicIcon
      :icon="icon"
      scheme="neutral-snow"
    />
  </div>
</template>
<script>
export default {
  name: 'FullscreenControl',
  props: {
    icon: String,
  },
};
</script>
<style lang="scss" scoped>
.fullscreen-control {
  display: flex;

  user-select: none;
  cursor: pointer;
}
</style>
