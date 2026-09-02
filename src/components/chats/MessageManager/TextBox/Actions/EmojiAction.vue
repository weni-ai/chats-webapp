<template>
  <ActionItem
    icon="add_reaction"
    tooltip="Emoji"
    :pressed="isEmojiPickerOpen"
    :disabled="isDisabled"
    :disableFromParent="isAiLoading"
    showDivider
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useMediaMessagesWithTextFeatureFlag } from '@/composables/useMediaMessagesWithTextFeatureFlag';

import ActionItem from './ActionItem.vue';

defineOptions({
  name: 'EmojiAction',
});

const emit = defineEmits<{
  focusInput: [void];
}>();

const {
  isEmojiPickerOpen,
  inputMessage,
  audioRecorderStatus,
  audioMessage,
  mediaUploadFiles,
  isInternalNote,
  isDictationListening,
} = storeToRefs(useMessageManager());

const { isLoading: isAiLoading } = storeToRefs(useAiTextImprovement());
const { featureFlags } = storeToRefs(useFeatureFlag());

const isMediaMessagesWithTextEnabled = computed(() =>
  useMediaMessagesWithTextFeatureFlag(featureFlags.value),
);

const isDisabled = computed(() => {
  if (isInternalNote.value) {
    return false;
  }

  return (
    isDictationListening.value ||
    audioRecorderStatus.value !== 'idle' ||
    !!audioMessage.value ||
    (mediaUploadFiles.value.length > 0 &&
      !isMediaMessagesWithTextEnabled.value) ||
    inputMessage.value.startsWith('/')
  );
});

function handleClick() {
  isEmojiPickerOpen.value = !isEmojiPickerOpen.value;
  emit('focusInput');
}
</script>
