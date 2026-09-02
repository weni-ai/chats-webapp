<template>
  <section
    class="file-message"
    data-testid="assistant-file-message"
  >
    <UnnnicIcon
      icon="description"
      size="sm"
      scheme="fg-emphasized"
    />
    <button
      type="button"
      class="file-message__name"
      data-testid="assistant-file-open"
      @click="openFile"
    >
      {{ displayName }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'AssistantFileMessage',
});

const props = withDefaults(
  defineProps<{
    src: string;
    filename?: string;
  }>(),
  {
    filename: undefined,
  },
);

const displayName = computed(
  () => props.filename || props.src.split('/').pop() || 'file',
);

function openFile() {
  if (!props.src) {
    return;
  }

  window.open(props.src, '_blank', 'noopener,noreferrer');
}
</script>

<style lang="scss" scoped>
.file-message {
  display: flex;
  align-items: center;
  gap: $unnnic-space-2;
  width: 100%;
  min-width: 0;
  padding: $unnnic-space-3 $unnnic-space-4;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  &__name {
    min-width: 0;
    padding: 0;
    border: none;
    background: transparent;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    text-align: left;
    text-decoration: underline;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
}
</style>
