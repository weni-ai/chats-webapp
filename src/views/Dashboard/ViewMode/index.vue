<template>
  <div>
    <header class="view-mode__header">
      <h1 class="title">
        <unnnic-icon icon="view-1-1" size="md" />
        {{ $t('dashboard.view-mode.title', { agent: 'Fabricio Santos' }) }}
      </h1>
      <div class="close-button" @click="close" @keypress.enter="close">
        <unnnic-tool-tip :text="$t('dashboard.view-mode.close')" enabled side="left">
          <unnnic-icon size="sm" icon="close-1" />
        </unnnic-tool-tip>
      </div>
    </header>
  </div>
</template>
<script>
export default {
  name: 'ViewMode',

  methods: {
    close() {
      this.$router.replace({ name: 'dashboard.manager' });
    },
  },
};
</script>
<style lang="scss" scoped>
.view-mode__header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: $unnnic-spacing-stack-xs 0;

  background: $unnnic-color-brand-weni;
  color: $unnnic-color-neutral-black;

  cursor: default;

  .title {
    display: flex;
    gap: $unnnic-spacing-inline-xs;
    justify-content: center;

    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-regular;

    flex: 1;
  }

  .close-button {
    margin-right: calc(($unnnic-font-size-body-lg / 100 * 50) + $unnnic-spacing-stack-xs);
    cursor: pointer;

    .unnnic-tooltip {
      display: flex;
    }
  }
}
</style>
