<template>
  <ActionItem
    icon="bolt"
    :tooltip="t('quick_message')"
    :pressed="isSuggestionBoxOpen"
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
  name: 'QuickMessageAction',
});

const emit = defineEmits<{
  focusInput: [void];
}>();

const messageManager = useMessageManager();
const {
  inputMessage,
  isInternalNote,
  isSuggestionBoxOpen,
  audioRecorderStatus,
  audioMessage,
  mediaUploadFiles,
  isDictationListening,
} = storeToRefs(messageManager);

const { isLoading: isAiLoading } = storeToRefs(useAiTextImprovement());

const isValidInputMessage = computed(() =>
  isSuggestionBoxOpen.value
    ? !inputMessage.value.startsWith('/')
    : !!inputMessage.value.trim(),
);

const isDisabled = computed(
  () =>
    isValidInputMessage.value ||
    !!audioMessage.value ||
    mediaUploadFiles.value.length > 0 ||
    audioRecorderStatus.value !== 'idle' ||
    isInternalNote.value ||
    isDictationListening.value,
);

function handleClick() {
  const inQuickMessageMode =
    isSuggestionBoxOpen.value || inputMessage.value.startsWith('/');

  if (inQuickMessageMode) {
    inputMessage.value = '';
    isSuggestionBoxOpen.value = false;
  } else {
    inputMessage.value = '/';
  }

  emit('focusInput');
}
</script>
