import {
  computed,
  getCurrentInstance,
  onUnmounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import WeniWebchatService, {
  SERVICE_EVENTS,
  type Message,
} from '@weni/webchat-service';

import type { CopilotConnection } from '@/services/api/resources/chats/copilot';
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
import { extractCartCount } from '@/services/assistant/cartCount';
import { mapServiceMessage } from '@/services/assistant/messageMapper';
import type { AssistantMessage } from '@/services/assistant/types';

type ConnectionRef = Ref<CopilotConnection | undefined>;

export function useCopilotChat(connection: ConnectionRef) {
  const messages = ref<AssistantMessage[]>([]);
  const isThinking = ref(false);
  const cartCount = ref(0);

  let activeService: WeniWebchatService | null = null;
  let activeChannelUuid: string | null = null;

  const suggestions = computed(() => {
    const lastAiMessage = [...messages.value]
      .reverse()
      .find((message) => message.direction === 'ai');

    return lastAiMessage?.quickReplies || [];
  });

  function syncMessagesFromService(service: WeniWebchatService) {
    messages.value = service.getMessages().map(mapServiceMessage);
  }

  function handleMessageReceived(...args: unknown[]) {
    const message = args[0] as Message;
    if (!message?.id) {
      return;
    }

    const mapped = mapServiceMessage(message);
    const existingIndex = messages.value.findIndex(
      (item) => item.id === mapped.id,
    );

    if (existingIndex >= 0) {
      messages.value.splice(existingIndex, 1, mapped);
      return;
    }

    messages.value.push(mapped);
  }

  function handleMessageSent(...args: unknown[]) {
    handleMessageReceived(...args);
  }

  function handleThinkingStart() {
    isThinking.value = true;
  }

  function handleThinkingStop() {
    isThinking.value = false;
  }

  function handleCartUpdated(...args: unknown[]) {
    cartCount.value = extractCartCount(args[0]);
  }

  function unsubscribe(service: WeniWebchatService) {
    service.off(SERVICE_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    service.off(SERVICE_EVENTS.MESSAGE_SENT, handleMessageSent);
    service.off(SERVICE_EVENTS.THINKING_START, handleThinkingStart);
    service.off(SERVICE_EVENTS.THINKING_STOP, handleThinkingStop);
    service.off(SERVICE_EVENTS.CART_UPDATED, handleCartUpdated);
  }

  function subscribe(service: WeniWebchatService) {
    service.on(SERVICE_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    service.on(SERVICE_EVENTS.MESSAGE_SENT, handleMessageSent);
    service.on(SERVICE_EVENTS.THINKING_START, handleThinkingStart);
    service.on(SERVICE_EVENTS.THINKING_STOP, handleThinkingStop);
    service.on(SERVICE_EVENTS.CART_UPDATED, handleCartUpdated);
  }

  function detachCurrentService() {
    if (activeService) {
      unsubscribe(activeService);
    }

    activeService = null;
    activeChannelUuid = null;
    messages.value = [];
    isThinking.value = false;
    cartCount.value = 0;
  }

  function attachService(currentConnection: CopilotConnection) {
    const channelUuid = currentConnection.channelUuid;

    if (!channelUuid) {
      detachCurrentService();
      return;
    }

    if (activeChannelUuid === channelUuid && activeService) {
      return;
    }

    if (activeService) {
      unsubscribe(activeService);
    }

    const service = copilotSocketManager.getOrCreateService(
      channelUuid,
      currentConnection,
    );

    activeService = service;
    activeChannelUuid = channelUuid;
    subscribe(service);
    syncMessagesFromService(service);
  }

  function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || !activeService) {
      return;
    }

    activeService.sendMessage(trimmed);
  }

  watch(
    connection,
    (currentConnection) => {
      if (!currentConnection?.channelUuid) {
        detachCurrentService();
        return;
      }

      attachService(currentConnection);
    },
    { immediate: true },
  );

  if (getCurrentInstance()) {
    onUnmounted(() => {
      detachCurrentService();
    });
  }

  return {
    messages,
    isThinking,
    cartCount,
    suggestions,
    sendMessage,
  };
}
