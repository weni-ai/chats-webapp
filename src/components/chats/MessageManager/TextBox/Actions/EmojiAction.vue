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
import { useFeatureFlag } from '@/store/modules/featureFlag.js';

import ActionItem from './ActionItem.vue';

defineOptions({
  name: 'EmojiAction',
});

const emit = defineEmits<{
  focusInput: [void];
}>();

const featureFlagStore = useFeatureFlag();
const { featureFlags } = storeToRefs(featureFlagStore);

const isEnabledInternalNotesMedias = computed(() =>
  featureFlags.value.active_features?.includes(
    'weniChatsEnableInternalNoteMedias',
  ),
);
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

const isDisabled = computed(() => {
  if (isInternalNote.value && isEnabledInternalNotesMedias.value) {
    return false;
  }

  return (
    isDictationListening.value ||
    audioRecorderStatus.value !== 'idle' ||
    !!audioMessage.value ||
    mediaUploadFiles.value.length > 0 ||
    inputMessage.value.startsWith('/')
  );
});

function handleClick() {
  isEmojiPickerOpen.value = !isEmojiPickerOpen.value;
  emit('focusInput');
}
</script>
