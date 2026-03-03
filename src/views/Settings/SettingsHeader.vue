<template>
  <header class="settings-view__header">
    <h1
      class="header__title"
      data-testid="settings-view-header-title"
    >
      {{ $t('config_chats.title') }}
    </h1>
    <UnnnicButton
      :text="$t('config_chats.save_changes')"
      type="primary"
      :disabled="!hasUnsavedChanges"
      :loading="isSaving"
      data-testid="settings-save-button"
      @click="$emit('save')"
    />
  </header>
</template>

<script>
export default {
  name: 'SettingsHeader',

  props: {
    hasUnsavedChanges: {
      type: Boolean,
      default: false,
    },
    isSaving: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['save'],
};
</script>

<style lang="scss" scoped>
.settings-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $unnnic-spacing-xs;
  padding-bottom: $unnnic-spacing-md;
  border-bottom: 1px solid $unnnic-color-neutral-cleanest;

  .header__title {
    color: $unnnic-color-gray-900;
    font: $unnnic-font-display-1;
  }
}
</style>
