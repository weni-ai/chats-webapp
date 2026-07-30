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
      @click="handleClick"
    />
  </UnnnicToolTip>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMessageManager } from '@/store/modules/chats/messageManager';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'DictationAction',
});

const { t } = i18n.global;

const messageManagerStore = useMessageManager();
const { isDictationListening } = storeToRefs(messageManagerStore);

const handleClick = () => {
  isDictationListening.value = !isDictationListening.value;
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
</script>

<style scoped lang="scss"></style>
