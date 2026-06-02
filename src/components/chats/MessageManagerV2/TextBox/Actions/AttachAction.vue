<template>
  <ActionItem
    icon="attach_file_add"
    :tooltip="t('attach')"
    :disabled="isDisabled"
    :disableFromParent="isAiLoading"
    :showDivider="!isInDiscussion"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';

import ActionItem from './ActionItem.vue';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'AttachAction',
});

const emit = defineEmits<{
  openUploadFiles: [void];
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
  uploadFilesLimit,
} = storeToRefs(messageManager);

const { activeDiscussion } = storeToRefs(useDiscussions());
const { isLoading: isAiLoading } = storeToRefs(useAiTextImprovement());

const isInDiscussion = computed(() => !!activeDiscussion.value?.uuid);

const isValidInputMessage = computed(() =>
  isSuggestionBoxOpen.value
    ? !inputMessage.value.startsWith('/')
    : !!inputMessage.value.trim(),
);

const isDisabled = computed(() => {
  const hasBlockingInput = !isInternalNote.value && isValidInputMessage.value;

  return (
    hasBlockingInput ||
    mediaUploadFiles.value.length >= uploadFilesLimit.value ||
    audioRecorderStatus.value !== 'idle' ||
    !!audioMessage.value
  );
});

function handleClick() {
  if (isInternalNote.value) {
    audioMessage.value = null;
    audioRecorderStatus.value = 'idle';
  } else {
    clearInputs();
  }

  emit('openUploadFiles');
}
</script>
