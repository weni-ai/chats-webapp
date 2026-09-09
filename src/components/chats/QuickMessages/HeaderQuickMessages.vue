<template>
  <header
    class="header-quick-messages__header"
    data-testid="header-quick-messages"
  >
    <p>{{ headerTitle }}</p>
    <UnnnicButton
      iconCenter="close"
      type="tertiary"
      size="small"
      @click="$emit('close')"
    />
  </header>
</template>

<script setup>
import { computed } from 'vue';

import i18n from '@/plugins/i18n';

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
});

defineEmits(['close']);

const headerTitle = computed(
  () => props.title || i18n.global.t('quick_messages.title'),
);
</script>

<style lang="scss" scoped>
.header-quick-messages__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $unnnic-space-2;
  font: $unnnic-font-display-3;
  color: $unnnic-color-fg-emphasized;
  border-bottom: 1px solid $unnnic-color-border-soft;
  flex-shrink: 0;
}
</style>
