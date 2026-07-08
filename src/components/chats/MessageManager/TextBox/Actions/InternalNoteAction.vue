<template>
  <ActionItem
    icon="add_notes"
    :tooltip="isInternalNote ? t('close_internal_note') : t('internal_note')"
    :pressed="isInternalNote"
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
  name: 'InternalNoteAction',
});

const emit = defineEmits<{
  focusInput: [void];
}>();

const messageManager = useMessageManager();
const { clearInputs } = messageManager;
const {
  inputMessage,
  isInternalNote,
  isSuggestionBoxOpen,
  audioRecorderStatus,
  audioMessage,
  mediaUploadFiles,
} = storeToRefs(messageManager);

const { isLoading: isAiLoading } = storeToRefs(useAiTextImprovement());

const isValidInputMessage = computed(() =>
  isSuggestionBoxOpen.value
    ? !inputMessage.value.startsWith('/')
    : !!inputMessage.value.trim(),
);

const isDisabled = computed(() => {
  if (isInternalNote.value) {
    return false;
  }

  return (
    isValidInputMessage.value ||
    mediaUploadFiles.value.length > 0 ||
    !!audioMessage.value ||
    audioRecorderStatus.value !== 'idle'
  );
});

function handleClick() {
  if (isInternalNote.value) {
    clearInputs();
  } else {
    isInternalNote.value = !isInternalNote.value;
  }

  emit('focusInput');
}
</script>
