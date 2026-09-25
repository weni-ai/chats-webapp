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
        :messageId="message.id"
        :text="message.text"
        :suggestion="message.suggestion"
        :status="message.status"
        :type="message.type"
        :media="message.media"
        :filename="message.filename"
        :productCarousel="message.productCarousel"
        :productList="message.productList"
        :getQuantity="getQuantity"
        :readOnly="readOnly"
        :liked="feedbackByMessageId[message.id] ?? null"
        @send="emit('send', $event)"
        @send-catalog="emit('sendCatalog', $event)"
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
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type {
  AssistantMessage,
  ProductCarouselItem,
} from '@/services/assistant/types';
import CopilotFeedback from '@/services/api/resources/chats/copilotFeedback';
import { useRooms } from '@/store/modules/chats/rooms';
import HumanMessage from './HumanMessage.vue';
import AiMessage from './AiMessage.vue';
import ThinkingIndicator from './ThinkingIndicator.vue';
import TypingIndicator from './TypingIndicator.vue';

defineOptions({
  name: 'AssistantMessageList',
});

const props = withDefaults(
  defineProps<{
    messages?: AssistantMessage[];
    isThinking?: boolean;
    isTyping?: boolean;
    isLoadingHistory?: boolean;
    isVoiceModeActive?: boolean;
    voicePartialTranscript?: string;
    getQuantity?: (productId: string) => number;
    readOnly?: boolean;
    roomUuid?: string;
  }>(),
  {
    messages: () => [],
    isThinking: false,
    isTyping: false,
    isLoadingHistory: false,
    isVoiceModeActive: false,
    voicePartialTranscript: '',
    getQuantity: () => 0,
    readOnly: false,
    roomUuid: '',
  },
);

const emit = defineEmits<{
  send: [text: string];
  sendCatalog: [
    payload: {
      catalog: CatalogPayload;
      text: string;
      resolve?: () => void;
      reject?: (error?: unknown) => void;
    },
  ];
  wordRevealed: [];
  addToCart: [product: ProductCarouselItem];
  incrementCartItem: [product: ProductCarouselItem];
  decrementCartItem: [product: ProductCarouselItem];
}>();

const { activeRoom } = storeToRefs(useRooms());
const feedbackByMessageId = ref<Record<string, boolean>>({});

const resolvedRoomUuid = computed(
  () => props.roomUuid || activeRoom.value?.uuid || '',
);

async function loadRoomFeedbacks(roomUuid: string) {
  const feedbacks = await CopilotFeedback.getRoomFeedbacks({ roomUuid });
  feedbackByMessageId.value = Object.fromEntries(
    feedbacks
      .filter((item) => item.message_id && typeof item.liked === 'boolean')
      .map((item) => [item.message_id, item.liked]),
  );
}

watch(
  [resolvedRoomUuid, () => props.isLoadingHistory],
  async ([roomUuid, isLoadingHistory]) => {
    if (!roomUuid || isLoadingHistory) {
      return;
    }

    await loadRoomFeedbacks(roomUuid);
  },
  { immediate: true },
);
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
