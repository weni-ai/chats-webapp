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

    <section class="audio-recording-bar__actions">
      <UnnnicButton
        type="tertiary"
        size="small"
        iconCenter="close"
        data-testid="assistant-audio-recording-cancel"
        :aria-label="$t('contact_info.desk_copilot.assistant.cancel_recording')"
        @click="emit('cancel')"
      />
      <UnnnicButton
        type="primary"
        size="small"
        iconCenter="send"
        data-testid="assistant-audio-recording-send"
        :aria-label="$t('contact_info.desk_copilot.assistant.send_audio')"
        @click="emit('send')"
      />
    </section>
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
  send: [];
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
  justify-content: space-between;
  gap: $unnnic-space-3;
  width: 100%;
  padding: $unnnic-space-3 $unnnic-space-4;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  &__timer {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
  }
}
</style>
