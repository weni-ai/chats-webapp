<template>
  <!-- eslint-disable vue/no-v-html -->
  <p
    class="highlight-message-text"
    data-testid="highlight-message-text"
    :title="text"
    v-html="highlightedText"
  />
</template>

<script setup>
import { computed } from 'vue';
import { normalizeText } from '@/utils/string';

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

  const originalText = props.text;
  const normalizedSearchTerm = normalizeText(props.searchTerm);

  const matches = [];
  const textLength = originalText.length;
  const searchTermLength = props.searchTerm.length;

  // try to find matches with different window sizes
  // that can have different sizes after normalization (ex: "olá" vs "ola")
  for (
    let windowSize = searchTermLength;
    windowSize <= Math.min(textLength, searchTermLength + 5);
    windowSize++
  ) {
    for (let i = 0; i <= textLength - windowSize; i++) {
      const window = originalText.substring(i, i + windowSize);
      const normalizedWindow = normalizeText(window);

      if (normalizedWindow === normalizedSearchTerm) {
        const overlaps = matches.some(
          (match) => !(i >= match.end || i + windowSize <= match.start),
        );

        if (!overlaps) {
          matches.push({ start: i, end: i + windowSize });
          i += windowSize - 1;
        }
      }
    }
  }

  matches.sort((a, b) => a.start - b.start);

  if (matches.length === 0) {
    return escapedText;
  }

  let highlighted = '';
  let lastIndex = 0;

  for (const match of matches) {
    highlighted += escapedText.substring(lastIndex, match.start);

    const originalMatch = originalText.substring(match.start, match.end);
    const escapedMatch = escapeHtml(originalMatch);
    highlighted += `<span class="highlight" data-testid="highlight">${escapedMatch}</span>`;

    lastIndex = match.end;
  }

  highlighted += escapedText.substring(lastIndex);

  return highlighted;
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
