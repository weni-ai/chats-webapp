<template>
  <section
    class="desk-copilot"
    data-testid="desk-copilot"
  >
    <Cart
      v-if="currentView === 'cart'"
      :items="cartItems"
      :totalQuantity="productCartTotalQuantity"
      :currency="cartCurrency"
      :subtotal="cartSubtotal"
      :discount="cartDiscount"
      :total="cartTotal"
      @back="currentView = 'chat'"
      @remove="removeCartItem"
      @increment="incrementCartItem"
      @decrement="decrementCartItem"
      @place-order="handlePlaceOrder"
    />

    <template v-else>
      <section
        ref="listRef"
        class="desk-copilot__chat"
        data-testid="desk-copilot-chat"
      >
        <SummaryMessage v-if="enableRoomSummary" />

        <template v-if="isConfigured">
          <CartBadge
            v-if="productCartTotalQuantity > 0"
            :count="productCartTotalQuantity"
            @click="currentView = 'cart'"
          />

          <AssistantMessageList
            :messages="messages"
            :isThinking="isThinking"
            :isTyping="isTyping"
            :isLoadingHistory="isLoadingHistory"
            :isVoiceModeActive="isVoiceModeActive"
            :voicePartialTranscript="voicePartialTranscript"
            :getQuantity="getCartQuantity"
            @send="handleSendSuggestionToRoom"
            @word-revealed="scrollToBottomIfNear()"
            @add-to-cart="addCartItem"
            @increment-cart-item="incrementCartItem"
            @decrement-cart-item="decrementCartItem"
          />

          <section
            v-if="showGoToBottom"
            class="desk-copilot__go-to-bottom"
          >
            <UnnnicButton
              class="desk-copilot__go-to-bottom-button"
              type="tertiary"
              size="small"
              iconCenter="arrow_downward"
              data-testid="assistant-scroll-to-bottom"
              :aria-label="
                $t('contact_info.desk_copilot.assistant.scroll_to_bottom')
              "
              @click="scrollToBottom()"
            />
          </section>
        </template>
        <div ref="bottomAnchorRef" />
      </section>

      <template v-if="isConfigured">
        <SuggestionChips
          v-if="!isVoiceModePageActive && !isRecording"
          :suggestions="suggestions"
          @select="sendMessage"
        />
        <AssistantInput
          :isRecording="isRecording"
          :recordingDurationMs="recordingDurationMs"
          :isAudioRecordingSupported="isAudioRecordingSupported"
          :canEnterVoiceMode="canEnterVoiceMode"
          :isVoiceModePageActive="isVoiceModePageActive"
          :voiceModeState="voiceModeState"
          :voiceError="voiceError"
          :fileConfig="fileConfig"
          @send="sendMessage"
          @attach="sendAttachment"
          @start-recording="startRecording"
          @stop-recording="stopRecording"
          @cancel-recording="cancelRecording"
          @voice-enter="enter"
          @voice-exit="exit"
          @voice-retry="retry"
          @voice-dismiss="dismissError"
        />
      </template>

      <Disclaimer
        v-if="!isLoadingConnection && !isConfigured"
        :hasSummary="enableRoomSummary"
        :isHistory="isHistory"
        :isViewMode="isViewMode"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { UnnnicCallAlert } from '@weni/unnnic-system';
import SummaryMessage from './SummaryMessage.vue';
import Disclaimer from './Disclaimer.vue';
import Cart from './Cart.vue';
import AssistantMessageList from './assistant/AssistantMessageList.vue';
import AssistantInput from './assistant/AssistantInput.vue';
import SuggestionChips from './assistant/SuggestionChips.vue';
import CartBadge from './assistant/CartBadge.vue';
import { useAutoScroll } from '@/composables/assistant/useAutoScroll';
import { useCopilotChat } from '@/composables/assistant/useCopilotChat';
import { useProductCart } from '@/composables/assistant/useProductCart';
import { useVoiceMode } from '@/composables/assistant/useVoiceMode';
import { useCopilotConnection } from '@/composables/useCopilotConnection';
import i18n from '@/plugins/i18n';
import { useConfig } from '@/store/modules/config';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

defineOptions({
  name: 'DeskCopilotTab',
});

withDefaults(
  defineProps<{
    isHistory?: boolean;
    isViewMode?: boolean;
  }>(),
  {
    isHistory: false,
    isViewMode: false,
  },
);

const emit = defineEmits<{
  loaded: [];
}>();

const { project } = storeToRefs(useConfig());
const { activeRoom } = storeToRefs(useRooms());
const roomMessagesStore = useRoomMessages();

const currentView = ref<'chat' | 'cart'>('chat');

const {
  connection,
  isConfigured,
  isLoading: isLoadingConnection,
} = useCopilotConnection(activeRoom);

const roomUuid = computed(() => activeRoom.value?.uuid);
const {
  messages,
  isThinking,
  isTyping,
  isLoadingHistory,
  suggestions,
  isRecording,
  recordingDurationMs,
  isAudioRecordingSupported,
  isVoiceEnabledByServer,
  fileConfig,
  sendMessage,
  sendOrder,
  sendAttachment,
  startRecording,
  stopRecording,
  cancelRecording,
  requestVoiceTokens,
} = useCopilotChat(connection, roomUuid);

const {
  items: cartItems,
  totalQuantity: productCartTotalQuantity,
  currency: cartCurrency,
  subtotal: cartSubtotal,
  discount: cartDiscount,
  total: cartTotal,
  getQuantity: getCartQuantity,
  addItem: addCartItem,
  incrementQuantity: incrementCartItem,
  decrementQuantity: decrementCartItem,
  removeItem: removeCartItem,
  clear: clearCart,
  toOrderProductItems,
} = useProductCart();

const {
  canEnterVoiceMode,
  isVoiceModeActive,
  isVoiceModePageActive,
  voiceModeState,
  voicePartialTranscript,
  voiceError,
  enter,
  exit,
  retry,
  dismissError,
} = useVoiceMode({
  isVoiceEnabledByServer,
  messages,
  sendMessage,
  requestVoiceTokens,
});

const {
  listRef,
  bottomAnchorRef,
  showGoToBottom,
  scrollToBottom,
  scrollToBottomIfNear,
} = useAutoScroll(messages, isThinking, isTyping);

const enableRoomSummary = computed(
  () => !!project.value?.config?.has_chats_summary,
);

async function handleSendSuggestionToRoom(text: string) {
  const trimmed = text?.trim();
  const activeRoomUuid = activeRoom.value?.uuid;

  if (!trimmed || !activeRoomUuid) {
    return;
  }

  await roomMessagesStore.sendRoomMessage(trimmed, null, null, activeRoomUuid);
}

async function handlePlaceOrder() {
  const productItems = toOrderProductItems();
  if (productItems.length === 0) {
    return;
  }

  try {
    await sendOrder(productItems);
    clearCart();
    currentView.value = 'chat';
  } catch (error) {
    console.error('Failed to place order:', error);
    UnnnicCallAlert({
      props: {
        text: i18n.global.t(
          'contact_info.desk_copilot.assistant.cart.place_order_error',
        ),
        type: 'error',
      },
    });
  }
}

watch(productCartTotalQuantity, (quantity) => {
  if (quantity === 0 && currentView.value === 'cart') {
    currentView.value = 'chat';
  }
});

onMounted(() => {
  emit('loaded');
});
</script>

<style lang="scss" scoped>
.desk-copilot {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  padding: $unnnic-space-2;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__chat {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    flex: 1;
    min-height: 0;
    overflow: hidden auto;
    padding-bottom: $unnnic-space-2;
  }

  &__go-to-bottom {
    display: flex;
    justify-content: center;
    position: sticky;
    bottom: -$unnnic-space-4;
    left: 0;
    right: 0;
    height: $unnnic-space-16;
    z-index: 1;
    pointer-events: none;
    background-image: linear-gradient(
      to bottom,
      transparent,
      $unnnic-color-bg-base
    );
  }

  &__go-to-bottom-button {
    pointer-events: auto;
    align-self: center;
    animation: assistant-go-to-bottom-enter 0.4s ease both;
  }
}

@keyframes assistant-go-to-bottom-enter {
  from {
    opacity: 0;
    transform: translateY(100%);
  }

  30% {
    opacity: 0;
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
