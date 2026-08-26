<template>
  <UnnnicButton
    type="secondary"
    size="small"
    iconCenter="graphic_eq"
    data-testid="assistant-voice-mode-button"
    :aria-label="$t('contact_info.desk_copilot.assistant.voice_mode.enter')"
    @click="emit('click')"
  />
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantVoiceModeButton',
});

const emit = defineEmits<{
  click: [];
}>();
</script>
