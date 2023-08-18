<template>
  <div class="co-pilot">
    <header></header>
    <section class="co-pilot__response">
      <unnnic-icon-svg class="icon-spin" icon="loading-circle-1" scheme="neutral-dark" />
    </section>
  </div>
</template>
<script>
export default {
  name: 'CoPilot',
};
</script>
<style lang="scss" scoped>
.co-pilot {
  background-color: $unnnic-color-background-snow;
  width: 100%;
}
</style>
