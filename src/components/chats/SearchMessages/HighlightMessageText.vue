<template>
  <!-- eslint-disable vue/no-v-html -->
  <p
    class="highlight-message-text"
    :title="text"
    v-html="highlightedText"
  />
</template>

<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'HighlightMessageText',
});

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  searchTerm: {
    type: String,
    default: '',
  },
});

const highlightedText = computed(() => {
  const escapedText = escapeHtml(props.text || '');

  if (!props.searchTerm) {
    return escapedText;
  }

  const escapedSearchTerm = escapeHtml(props.searchTerm);

  const regex = new RegExp(
    `(${escapedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi',
  );

  return escapedText.replace(regex, '<span class="highlight">$1</span>');
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
</script>

<style lang="scss" scoped>
.highlight-message-text {
  font: $unnnic-font-body;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: block;
  color: $unnnic-color-fg-base;
  :deep(.highlight) {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-warning;
    white-space: nowrap;
  }
}
</style>
