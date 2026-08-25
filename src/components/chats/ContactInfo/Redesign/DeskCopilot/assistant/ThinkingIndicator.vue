<template>
  <section
    class="thinking-indicator"
    data-testid="assistant-thinking-indicator"
  >
    <UnnnicIcon
      class="thinking-indicator__icon"
      icon="progress_activity"
      size="sm"
      scheme="fg-emphasized"
    />
    <p class="thinking-indicator__text">
      {{ $t('contact_info.desk_copilot.assistant.processing_information') }}
    </p>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantThinkingIndicator',
});
</script>

<style lang="scss" scoped>
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: $unnnic-space-2;
  width: 100%;

  &__icon {
    flex-shrink: 0;
    animation: assistant-spin 1s linear infinite;
  }

  &__text {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
  }
}

@keyframes assistant-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
