<template>
  <header
    class="header-quick-messages__header"
    data-testid="header-quick-messages"
  >
    <p>{{ $t('quick_messages.title') }}</p>
    <UnnnicButton
      iconCenter="close"
      type="tertiary"
      size="small"
      @click="$emit('close')"
    />
  </header>
</template>

<script setup>
defineEmits(['close']);
</script>

<style lang="scss" scoped>
.header-quick-messages__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $unnnic-space-4 $unnnic-space-2;
  font: $unnnic-font-display-3;
  color: $unnnic-color-fg-emphasized;
  border-bottom: 1px solid $unnnic-color-border-soft;
}
</style>
