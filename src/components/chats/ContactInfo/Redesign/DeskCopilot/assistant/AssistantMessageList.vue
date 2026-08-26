<template>
  <section
    class="assistant-message-list"
    data-testid="assistant-message-list"
  >
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
  }>(),
  {
    messages: () => [],
    isThinking: false,
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
}
</style>
