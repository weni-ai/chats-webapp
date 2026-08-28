<template>
  <section
    class="voice-mode-panel"
    data-testid="assistant-voice-mode-panel"
  >
    <section class="voice-mode-panel__status">
      <UnnnicIcon
        class="voice-mode-panel__icon"
        icon="graphic_eq"
        size="sm"
        scheme="fg-accent"
      />
      <p
        class="voice-mode-panel__text"
        data-testid="assistant-voice-mode-status"
      >
        {{ statusText }}
      </p>
    </section>

    <UnnnicButton
      type="tertiary"
      size="small"
      iconCenter="close"
      data-testid="assistant-voice-mode-exit"
      :aria-label="$t('contact_info.desk_copilot.assistant.voice_mode.exit')"
      @click="emit('exit')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineOptions({
  name: 'AssistantVoiceModePanel',
});

const props = withDefaults(
  defineProps<{
    state?: string | null;
  }>(),
  {
    state: null,
  },
);

const emit = defineEmits<{
  exit: [];
}>();

const { t } = useI18n();

const statusText = computed(() => {
  if (props.state === 'speaking') {
    return t('contact_info.desk_copilot.assistant.voice_mode.speaking');
  }

  if (props.state === 'processing') {
    return t('contact_info.desk_copilot.assistant.voice_mode.processing');
  }

  return t('contact_info.desk_copilot.assistant.voice_mode.listening');
});
</script>

<style lang="scss" scoped>
.voice-mode-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $unnnic-space-3;
  width: 100%;
  padding: $unnnic-space-3 $unnnic-space-4;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  &__status {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    min-width: 0;
  }

  &__icon {
    flex-shrink: 0;
    animation: voice-eq-pulse 1.2s ease-in-out infinite;
  }

  &__text {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-muted;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@keyframes voice-eq-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.95);
  }

  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}
</style>
