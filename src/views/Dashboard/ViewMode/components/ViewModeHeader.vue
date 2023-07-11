<template>
  <header class="view-mode__header" v-if="viewedAgent">
    <h1 class="title">
      <unnnic-icon icon="view-1-1" size="md" />
      {{ $t('dashboard.view-mode.title', { viewedAgent }) }}
    </h1>
    <div class="close-button" @click="closeViewMode" @keypress.enter="closeViewMode">
      <unnnic-tool-tip :text="$t('dashboard.view-mode.close')" enabled side="left">
        <unnnic-icon size="sm" icon="close-1" />
      </unnnic-tool-tip>
    </div>
  </header>
</template>
<script>
export default {
  name: 'ViewModeHeader',

  props: {
    viewedAgent: {
      required: true,
      type: String,
    },
  },

  methods: {
    async closeViewMode() {
      await this.$store.dispatch('rooms/setActiveRoom', null);
      this.$router.push({ name: 'dashboard.manager' });
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
