<template>
  <UnnnicAudioRecorder
    v-show="isAudioRecorderVisible"
    ref="unnnicAudioRecorder"
    v-model="audioMessage"
    class="text-box__audio-recorder"
    hideRecordingIndicator
    :saveText="$t('use')"
    @status="handleAudioRecorderStatus"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';
import { computed, useTemplateRef } from 'vue';

defineOptions({
  name: 'MessageManagerTextBoxAudioRecorder',
});
const messageManager = useMessageManager();
const { audioMessage, audioRecorderStatus } = storeToRefs(messageManager);

const unnnicAudioRecorderRef = useTemplateRef('unnnicAudioRecorder');

const isAudioRecorderVisible = computed(() => {
  return ['recording', 'recorded', 'playing', 'paused'].includes(
    audioRecorderStatus.value,
  );
});

const handleAudioRecorderStatus = (status: string) => {
  audioRecorderStatus.value = status;
};

const record = () => {
  unnnicAudioRecorderRef.value?.record();
};

defineExpose({
  record,
});
</script>

<style scoped lang="scss">
:deep(.audio-handler__time) {
  display: inline-block;
  min-width: 64px;
}
</style>
