<template>
  <UnnnicToolTip
    :text="tooltipText"
    enabled
    side="top"
  >
    <UnnnicButton
      :iconLeft="buttonIcon"
      type="primary"
      size="small"
      :text="buttonText"
      :disabled="isDisabledInput"
      :pressed="isDictationListening"
      @click="handleClick"
    />
  </UnnnicToolTip>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useSpeechRecognition } from '@/composables/useSpeechRecognition';
import { useMessageManager } from '@/store/modules/chats/messageManager';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'DictationAction',
});

const { t } = i18n.global;

const messageManagerStore = useMessageManager();
const { isDictationListening, inputMessage, isDisabledInput } =
  storeToRefs(messageManagerStore);

const voiceRecognition = useSpeechRecognition({
  continuous: true,
  interimResults: true,
});

const startDictation = () => {
  if (isDisabledInput.value || isDictationListening.value) return;

  voiceRecognition.start();
  isDictationListening.value = true;
};

const stopDictation = () => {
  if (!isDictationListening.value) return;

  voiceRecognition.stop();
  isDictationListening.value = false;
};

const handleClick = () => {
  if (isDictationListening.value) {
    stopDictation();
    return;
  }

  startDictation();
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isDictationListening.value) {
    event.preventDefault();
    stopDictation();
    return;
  }

  const isShiftV =
    event.shiftKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    event.code === 'KeyV';

  if (isShiftV && !isDictationListening.value) {
    event.preventDefault();
    startDictation();
  }
};

const buttonIcon = computed(() => {
  if (isDictationListening.value) {
    return 'svg-spinners:bars-scale-middle';
  }
  return 'graphic_eq';
});

const tooltipText = computed(() => {
  if (isDictationListening.value) {
    return t('message_dictation.tooltip.stop');
  }
  return t('message_dictation.tooltip.activate');
});

const buttonText = computed(() => {
  if (isDictationListening.value) {
    return t('message_dictation.button.stop');
  }
  return t('message_dictation.button.activate');
});

watch(
  () => voiceRecognition.result.value,
  (newResult) => {
    inputMessage.value = newResult;
  },
);

watch(
  () => voiceRecognition.error.value,
  (recognitionError) => {
    if (recognitionError) {
      isDictationListening.value = false;
    }
  },
);

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped lang="scss"></style>
