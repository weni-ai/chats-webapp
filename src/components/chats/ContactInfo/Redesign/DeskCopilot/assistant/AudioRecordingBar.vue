<template>
  <section
    class="audio-recording-bar"
    data-testid="assistant-audio-recording-bar"
  >
    <p
      class="audio-recording-bar__timer"
      data-testid="assistant-audio-recording-timer"
    >
      {{ formattedDuration }}
    </p>

    <UnnnicButton
      type="tertiary"
      size="small"
      iconCenter="close"
      data-testid="assistant-audio-recording-cancel"
      :aria-label="$t('contact_info.desk_copilot.assistant.cancel_recording')"
      @click="emit('cancel')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'AssistantAudioRecordingBar',
});

const props = withDefaults(
  defineProps<{
    durationMs?: number;
  }>(),
  {
    durationMs: 0,
  },
);

const emit = defineEmits<{
  cancel: [];
}>();

const formattedDuration = computed(() => {
  const totalSeconds = Math.floor(Math.max(0, props.durationMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
});
</script>

<style lang="scss" scoped>
.audio-recording-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $unnnic-space-2;
  flex: 1;
  min-width: 0;
  height: $unnnic-space-10;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  &__timer {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    margin: 0;
    padding-right: $unnnic-space-2;
    font: $unnnic-font-display-4;
    color: $unnnic-color-fg-emphasized;

    &::before {
      content: '';
      width: $unnnic-space-2;
      height: $unnnic-space-2;
      border-radius: 50%;
      background-color: $unnnic-color-fg-critical;
      animation: recording-pulse 1.2s infinite;
    }
  }
}

@keyframes recording-pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
