<template>
  <section class="settings-layout">
    <section id="view">
      <RouterView />
    </section>
  </section>
</template>

<script>
export default {
  name: 'SettingsLayout',
};
</script>

<style lang="scss" scoped>
.settings-layout {
  height: 100%;

  #view {
    padding-top: $unnnic-spacing-inset-nano;

    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;
    height: 100%;
  }
}
</style>
