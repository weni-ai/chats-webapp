<template>
  <header class="settings-view__header">
    <h1
      class="header__title"
      data-testid="settings-view-header-title"
    >
      {{ $t('config_chats.title') }}
    </h1>
  </header>
</template>

<script>
export default {
  name: 'SettingsHeader',
};
</script>

<style lang="scss" scoped>
.settings-view__header {
  display: flex;
  align-items: center;
  gap: $unnnic-spacing-xs;

  .header__title {
    color: $unnnic-color-gray-900;
    font: $unnnic-font-display-1;
  }
}
</style>
