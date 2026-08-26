<template>
  <section
    class="voice-mode-error"
    role="alert"
    data-testid="assistant-voice-mode-error"
  >
    <UnnnicIcon
      icon="error"
      size="md"
      scheme="fg-critical"
    />

    <h2 class="voice-mode-error__title">
      {{ $t('contact_info.desk_copilot.assistant.voice_mode.error_title') }}
    </h2>

    <p
      v-if="error?.message"
      class="voice-mode-error__message"
    >
      {{ error.message }}
    </p>

    <p
      v-if="error?.suggestion"
      class="voice-mode-error__suggestion"
    >
      {{ error.suggestion }}
    </p>

    <section class="voice-mode-error__actions">
      <UnnnicButton
        v-if="error?.recoverable"
        type="secondary"
        size="small"
        iconLeft="refresh"
        data-testid="assistant-voice-mode-retry"
        @click="emit('retry')"
      >
        {{ $t('contact_info.desk_copilot.assistant.voice_mode.retry') }}
      </UnnnicButton>
      <UnnnicButton
        type="tertiary"
        size="small"
        data-testid="assistant-voice-mode-dismiss"
        @click="emit('dismiss')"
      >
        {{ $t('contact_info.desk_copilot.assistant.voice_mode.dismiss') }}
      </UnnnicButton>
    </section>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantVoiceModeError',
});

defineProps<{
  error: {
    code?: string;
    message?: string;
    suggestion?: string;
    recoverable?: boolean;
  } | null;
}>();

const emit = defineEmits<{
  retry: [];
  dismiss: [];
}>();
</script>

<style lang="scss" scoped>
.voice-mode-error {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-2;
  width: 100%;
  padding: $unnnic-space-3 $unnnic-space-4;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  &__title {
    margin: 0;
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
  }

  &__message,
  &__suggestion {
    margin: 0;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-muted;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    flex-wrap: wrap;
  }
}
</style>
