<template>
  <section
    class="assistant-message-list"
    data-testid="assistant-message-list"
  >
    <section
      v-if="isLoadingHistory && messages.length === 0"
      class="assistant-message-list__loading"
      data-testid="assistant-history-loading"
    >
      <UnnnicSkeletonLoading
        v-for="index in 3"
        :key="index"
        class="assistant-message-list__skeleton"
        :class="{
          'assistant-message-list__skeleton--human': index % 2 === 1,
        }"
        height="40px"
      />
      <p class="assistant-message-list__loading-text">
        {{ $t('contact_info.desk_copilot.assistant.loading_conversation') }}
      </p>
    </section>

    <template
      v-for="message in messages"
      :key="message.id"
    >
      <HumanMessage
        v-if="message.direction === 'human'"
        :text="message.text"
      />
      <AiMessage
        v-else
        :text="message.text"
        :suggestion="message.suggestion"
        @send="emit('send', $event)"
      />
    </template>

    <ThinkingIndicator v-if="isThinking" />
  </section>
</template>

<script setup lang="ts">
import type { AssistantMessage } from '@/services/assistant/types';
import HumanMessage from './HumanMessage.vue';
import AiMessage from './AiMessage.vue';
import ThinkingIndicator from './ThinkingIndicator.vue';

defineOptions({
  name: 'AssistantMessageList',
});

withDefaults(
  defineProps<{
    messages?: AssistantMessage[];
    isThinking?: boolean;
    isLoadingHistory?: boolean;
  }>(),
  {
    messages: () => [],
    isThinking: false,
    isLoadingHistory: false,
  },
);

const emit = defineEmits<{
  send: [text: string];
}>();
</script>

<style lang="scss" scoped>
.assistant-message-list {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  width: 100%;

  &__loading {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    width: 100%;
  }

  &__skeleton {
    width: 72%;
    max-width: 100%;
    align-self: flex-start;

    &--human {
      align-self: flex-end;
      width: 56%;
    }
  }

  &__loading-text {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
  }
}
</style>
