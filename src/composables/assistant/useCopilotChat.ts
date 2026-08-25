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
type RoomUuidRef = Ref<string | undefined>;

export function useCopilotChat(
  connection: ConnectionRef,
  roomUuid: RoomUuidRef,
) {
  const messages = ref<AssistantMessage[]>([]);
  const isThinking = ref(false);
  const cartCount = ref(0);

  let activeService: WeniWebchatService | null = null;
  let activeChannelUuid: string | null = null;
  let activeRoomUuid: string | null = null;
  let activeConnection: CopilotConnection | null = null;

  const suggestions = computed(() => {
    const lastAiMessage = [...messages.value]
      .reverse()
      .find((message) => message.direction === 'ai');

    return lastAiMessage?.quickReplies || [];
  });

  function resetViewState() {
    messages.value = [];
    isThinking.value = false;
    cartCount.value = 0;
  }

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

  function detachCurrentView() {
    if (activeService) {
      unsubscribe(activeService);
    }

    activeService = null;
    activeChannelUuid = null;
    activeRoomUuid = null;
    activeConnection = null;
    resetViewState();
  }

  function scheduleActiveRoomEviction() {
    if (!activeRoomUuid || !activeConnection) {
      return;
    }

    copilotSocketManager.scheduleEviction(activeRoomUuid, activeConnection);
  }

  function attachService(
    currentConnection: CopilotConnection,
    currentRoomUuid: string,
  ) {
    const channelUuid = currentConnection.channelUuid;

    if (
      activeChannelUuid === channelUuid &&
      activeRoomUuid === currentRoomUuid &&
      activeService
    ) {
      return;
    }

    if (activeService) {
      unsubscribe(activeService);
    }

    resetViewState();

    const service = copilotSocketManager.getOrCreateService(
      currentRoomUuid,
      currentConnection,
    );

    activeService = service;
    activeChannelUuid = channelUuid;
    activeRoomUuid = currentRoomUuid;
    activeConnection = currentConnection;
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
    [connection, roomUuid],
    ([currentConnection, currentRoomUuid], previous) => {
      const previousConnection = previous?.[0];
      const previousRoomUuid = previous?.[1];
      const isSameRoom =
        !!currentRoomUuid &&
        currentRoomUuid === previousRoomUuid &&
        currentConnection?.channelUuid === previousConnection?.channelUuid;

      if (isSameRoom) {
        return;
      }

      if (previousRoomUuid && previousConnection?.channelUuid) {
        copilotSocketManager.scheduleEviction(
          previousRoomUuid,
          previousConnection,
        );
      }

      if (!currentConnection?.channelUuid || !currentRoomUuid) {
        detachCurrentView();
        return;
      }

      attachService(currentConnection, currentRoomUuid);
    },
    { immediate: true },
  );

  if (getCurrentInstance()) {
    onUnmounted(() => {
      scheduleActiveRoomEviction();
      detachCurrentView();
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
