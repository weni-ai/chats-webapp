<template>
  <UnnnicButton
    :iconLeft="isInternalNote ? '' : 'send'"
    :tooltip="isInternalNote ? '' : t('send')"
    :type="isInternalNote ? 'attention' : 'primary'"
    size="small"
    :text="isInternalNote ? t('add') : t('send')"
    :disabled="disableSendButton || isAiLoading"
    @click="emit('send')"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'SendAction',
});

const emit = defineEmits<{
  send: [void];
}>();

const { isInternalNote, disableSendButton } = storeToRefs(useMessageManager());
const { isLoading: isAiLoading } = storeToRefs(useAiTextImprovement());
</script>
