<template>
  <header class="settings-view__header">
    <UnnnicAvatarIcon
      data-testid="settings-view-header-icon"
      icon="settings"
      scheme="weni-600"
    />
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
    color: $unnnic-color-neutral-darkest;
    font-family: $unnnic-font-family-primary;
    font-size: $unnnic-font-size-title-sm;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-title-sm + $unnnic-line-height-md;
  }
}
</style>
