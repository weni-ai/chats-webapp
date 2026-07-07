<template>
  <section class="back-to-original">
    <UnnnicToolTip
      :enabled="true"
      :text="$t('ai_text_improvement.back_to_original_tooltip')"
      side="left"
    >
      <UnnnicButton
        type="tertiary"
        iconLeft="undo"
        size="small"
        :text="$t('ai_text_improvement.back_to_original')"
        class="back-to-original__button"
        @click="handleClick"
      />
    </UnnnicToolTip>
  </section>
</template>

<script setup lang="ts">
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';
import { useMessageManager } from '@/store/modules/chats/messageManager';

defineOptions({
  name: 'BackToOriginal',
});

const emit = defineEmits<{
  reverted: [void];
}>();

const aiTextImprovementStore = useAiTextImprovement();
const messageManager = useMessageManager();

function handleClick() {
  messageManager.inputMessage = aiTextImprovementStore.originalText;
  aiTextImprovementStore.feedbackStatus = 'DISCARDED';
  aiTextImprovementStore.improvedText = '';
  emit('reverted');
}
</script>

<style scoped lang="scss">
.back-to-original {
  flex-shrink: 0;
  display: flex;

  :deep(.unnnic-tooltip) {
    display: flex;
  }

  &__button {
    height: auto;
    align-self: stretch;
  }
}
</style>
