<template>
  <section
    class="ai-text-improvement"
    @mouseenter="handleMouseEnter"
  >
    <UnnnicToolTip
      v-if="!isLoading"
      :enabled="true"
      :text="tooltipText"
      side="top"
    >
      <UnnnicPopover
        :open="isPopoverOpen"
        @update:open="isPopoverOpen = $event"
      >
        <UnnnicPopoverTrigger>
          <section class="ai-text-improvement__button-wrapper">
            <span
              v-if="showNewTag"
              class="ai-text-improvement__new-tag"
            >
              {{ $t('ai_text_improvement.new') }}
            </span>
            <UnnnicButton
              iconCenter="wand_shine"
              type="tertiary"
              size="small"
              :disabled="isDisabled"
              @click.stop="handleButtonClick"
            />
          </section>
        </UnnnicPopoverTrigger>
        <UnnnicPopoverContent
          size="small"
          side="top"
          align="start"
        >
          <section class="ai-text-improvement__popover">
            <section
              v-for="option in improvementOptions"
              :key="option.type"
              class="ai-text-improvement__popover-item"
              @click="selectOption(option.type)"
            >
              <p class="ai-text-improvement__popover-item-text">
                {{ option.label }}
              </p>
            </section>
          </section>
        </UnnnicPopoverContent>
      </UnnnicPopover>
    </UnnnicToolTip>

    <UnnnicToolTip
      v-else
      :enabled="true"
      :text="$t('ai_text_improvement.tooltip_cancel')"
      side="top"
    >
      <UnnnicButton
        type="secondary"
        size="small"
        iconLeft="close"
        :text="$t('ai_text_improvement.improvement')"
        @click="handleCancel"
      />
    </UnnnicToolTip>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';
import { useMessageManager } from '@/store/modules/chats/messageManager';

import type { AiTextImprovementType } from '@/services/api/resources/chats/aiTextImprovement';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'AiTextImprovement',
});

const emit = defineEmits<{
  improvementReceived: [text: string];
  improvementCancelled: [void];
}>();

const aiTextImprovement = useAiTextImprovement();
const { isLoading, isPopoverOpen, showNewTag } = storeToRefs(aiTextImprovement);

const messageManager = useMessageManager();
const { inputMessage } = storeToRefs(messageManager);

const isDisabled = computed(() => !inputMessage.value.trim());

const tooltipText = computed(() =>
  isDisabled.value
    ? t('ai_text_improvement.tooltip_disabled')
    : t('ai_text_improvement.tooltip_enabled'),
);

const improvementOptions = computed(() => [
  {
    type: 'GRAMMAR_AND_SPELLING' as AiTextImprovementType,
    label: t('ai_text_improvement.fix_grammar_and_spelling'),
  },
  {
    type: 'MORE_EMPATHY' as AiTextImprovementType,
    label: t('ai_text_improvement.make_more_empathetic'),
  },
  {
    type: 'CLARITY' as AiTextImprovementType,
    label: t('ai_text_improvement.rewrite_for_clarity'),
  },
]);

function handleMouseEnter() {
  if (showNewTag.value) {
    aiTextImprovement.hideNewTag();
  }
}

function handleButtonClick() {
  if (!isDisabled.value) {
    isPopoverOpen.value = !isPopoverOpen.value;
  }
}

async function selectOption(type: AiTextImprovementType) {
  isPopoverOpen.value = false;

  const text = inputMessage.value.trim();
  if (!text) return;

  const improvedText = await aiTextImprovement.requestImprovement(text, type);

  if (improvedText) {
    emit('improvementReceived', improvedText);
  } else if (!aiTextImprovement.isLoading) {
    emit('improvementCancelled');
  }
}

function handleCancel() {
  aiTextImprovement.cancelImprovement();
  emit('improvementCancelled');
}
</script>

<style scoped lang="scss">
.ai-text-improvement {
  position: relative;

  &__button-wrapper {
    position: relative;
    display: inline-flex;
  }

  &__new-tag {
    position: absolute;
    top: -$unnnic-space-2;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;

    background-color: $unnnic-color-bg-purple-plain;
    color: $unnnic-color-fg-emphasized;
    // TODO: not exists in unnnic design system
    font-size: 8px;
    font-weight: $unnnic-font-weight-medium;
    line-height: 12px;
    padding: $unnnic-space-05 $unnnic-space-2;
    border-radius: $unnnic-radius-4;
    white-space: nowrap;
    pointer-events: none;
  }

  &__popover {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }

  &__popover-item {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    padding: $unnnic-space-2 $unnnic-space-4;
    border-radius: $unnnic-radius-2;
    cursor: pointer;

    &:hover {
      background-color: $unnnic-color-bg-muted;
    }
  }

  &__popover-item-text {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
    white-space: nowrap;
  }
}
</style>
