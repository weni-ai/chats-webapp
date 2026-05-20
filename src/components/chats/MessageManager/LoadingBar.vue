<template>
  <section class="loading-bar__container">
    <div
      class="loading-bar"
      :style="{ width: `${value * 100}%` }"
    />
  </section>
</template>

<script>
export default {
  name: 'LoadingBar',

  props: {
    value: {
      type: Number,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.loading-bar__container {
  position: absolute;
  top: 0;
  z-index: 100;

  grid-area: loading;

  width: 100%;
  height: $unnnic-border-width-thin;

  background-color: $unnnic-color-border-soft;

  overflow: hidden;

  .loading-bar {
    height: $unnnic-border-width-thin;

    background-color: $unnnic-color-fg-base;
    transition: width 0.2s;
  }
}
</style>
