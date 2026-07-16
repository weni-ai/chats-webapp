<template>
  <ActionItem
    icon="mic"
    :tooltip="t('audio_message')"
    :pressed="isPressed"
    :disabled="isDisabled"
    :disableFromParent="isAiLoading"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';

import ActionItem from './ActionItem.vue';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'AudioAction',
});

const emit = defineEmits<{
  toggleAudioRecording: [void];
}>();

const {
  inputMessage,
  isInternalNote,
  isSuggestionBoxOpen,
  audioRecorderStatus,
  mediaUploadFiles,
  isDictationListening,
} = storeToRefs(useMessageManager());

const { isLoading: isAiLoading } = storeToRefs(useAiTextImprovement());

const isValidInputMessage = computed(() =>
  isSuggestionBoxOpen.value
    ? !inputMessage.value.startsWith('/')
    : !!inputMessage.value.trim(),
);

const isDisabled = computed(
  () =>
    isValidInputMessage.value ||
    mediaUploadFiles.value.length > 0 ||
    isInternalNote.value ||
    isDictationListening.value,
);

const isPressed = computed(() =>
  ['recording', 'recorded', 'playing', 'paused'].includes(
    audioRecorderStatus.value,
  ),
);

function handleClick() {
  emit('toggleAudioRecording');
}
</script>
