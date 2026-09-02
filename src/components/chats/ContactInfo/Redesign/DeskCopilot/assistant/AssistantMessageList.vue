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
    </section>

    <template
      v-for="message in messages"
      :key="message.id"
    >
      <HumanMessage
        v-if="message.direction === 'human'"
        :text="message.text"
        :type="message.type"
        :media="message.media"
        :filename="message.filename"
      />
      <AiMessage
        v-else
        :text="message.text"
        :suggestion="message.suggestion"
        :status="message.status"
        :type="message.type"
        :media="message.media"
        :filename="message.filename"
        :productCarousel="message.productCarousel"
        :getQuantity="getQuantity"
        @send="emit('send', $event)"
        @word-revealed="emit('wordRevealed')"
        @add-to-cart="emit('addToCart', $event)"
        @increment-cart-item="emit('incrementCartItem', $event)"
        @decrement-cart-item="emit('decrementCartItem', $event)"
      />
    </template>

    <HumanMessage
      v-if="isVoiceModeActive && voicePartialTranscript"
      :text="voicePartialTranscript"
      data-testid="assistant-voice-partial-transcript"
    />

    <ThinkingIndicator v-if="isThinking" />
    <TypingIndicator v-else-if="isTyping" />
  </section>
</template>

<script setup lang="ts">
import type {
  AssistantMessage,
  ProductCarouselItem,
} from '@/services/assistant/types';
import HumanMessage from './HumanMessage.vue';
import AiMessage from './AiMessage.vue';
import ThinkingIndicator from './ThinkingIndicator.vue';
import TypingIndicator from './TypingIndicator.vue';

defineOptions({
  name: 'AssistantMessageList',
});

withDefaults(
  defineProps<{
    messages?: AssistantMessage[];
    isThinking?: boolean;
    isTyping?: boolean;
    isLoadingHistory?: boolean;
    isVoiceModeActive?: boolean;
    voicePartialTranscript?: string;
    getQuantity?: (productId: string) => number;
  }>(),
  {
    messages: () => [],
    isThinking: false,
    isTyping: false,
    isLoadingHistory: false,
    isVoiceModeActive: false,
    voicePartialTranscript: '',
    getQuantity: () => 0,
  },
);

const emit = defineEmits<{
  send: [text: string];
  wordRevealed: [];
  addToCart: [product: ProductCarouselItem];
  incrementCartItem: [product: ProductCarouselItem];
  decrementCartItem: [product: ProductCarouselItem];
}>();
</script>

<style lang="scss" scoped>
.assistant-message-list {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  width: 100%;
  min-width: 0;

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
