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
} = storeToRefs(useMessageManager());

const { isLoading: isAiLoading } = storeToRefs(useAiTextImprovement());

const isDisabled = computed(
  () =>
    audioRecorderStatus.value !== 'idle' ||
    !!audioMessage.value ||
    mediaUploadFiles.value.length > 0 ||
    inputMessage.value.startsWith('/'),
);

function handleClick() {
  isEmojiPickerOpen.value = !isEmojiPickerOpen.value;
  emit('focusInput');
}
</script>
