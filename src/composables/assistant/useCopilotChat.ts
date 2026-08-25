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
  const isTyping = ref(false);
  const cartCount = ref(0);
  const isLoadingHistory = ref(false);

  let activeService: WeniWebchatService | null = null;
  let activeChannelUuid: string | null = null;
  let activeRoomUuid: string | null = null;
  let activeConnection: CopilotConnection | null = null;
  let historyLoadedTimer: ReturnType<typeof setTimeout> | null = null;

  const suggestions = computed(() => {
    const lastAiMessage = [...messages.value]
      .reverse()
      .find(
        (message) =>
          message.direction === 'ai' && message.status !== 'streaming',
      );

    return lastAiMessage?.quickReplies || [];
  });

  function resetViewState() {
    messages.value = [];
    isThinking.value = false;
    isTyping.value = false;
    cartCount.value = 0;
    isLoadingHistory.value = false;
  }

  function clearHistoryLoadedTimer() {
    if (!historyLoadedTimer) {
      return;
    }

    clearTimeout(historyLoadedTimer);
    historyLoadedTimer = null;
  }

  function finishHistoryLoading() {
    clearHistoryLoadedTimer();

    if (activeService) {
      syncMessagesFromService(activeService);
    }

    isLoadingHistory.value = false;
  }

  function syncMessagesFromService(service: WeniWebchatService) {
    messages.value = service.getMessages().map(mapServiceMessage);
  }

  function upsertMappedMessage(mapped: AssistantMessage) {
    const existingIndex = messages.value.findIndex(
      (item) => item.id === mapped.id,
    );

    if (existingIndex >= 0) {
      messages.value.splice(existingIndex, 1, mapped);
      return;
    }

    messages.value.push(mapped);
  }

  function handleMessageReceived(...args: unknown[]) {
    const message = args[0] as Message;
    if (!message?.id) {
      return;
    }

    upsertMappedMessage(mapServiceMessage(message));
  }

  function handleMessageSent(...args: unknown[]) {
    handleMessageReceived(...args);
  }

  function handleMessageUpdated(...args: unknown[]) {
    const messageId = args[0] as string;

    if (!messageId || !activeService) {
      return;
    }

    const updated = activeService
      .getMessages()
      .find((message) => message.id === messageId);

    if (!updated) {
      return;
    }

    upsertMappedMessage(mapServiceMessage(updated));
  }

  function handleThinkingStart() {
    isThinking.value = true;
  }

  function handleThinkingStop() {
    isThinking.value = false;
  }

  function handleTypingStart() {
    isTyping.value = true;
  }

  function handleTypingStop() {
    isTyping.value = false;
  }

  function handleCartUpdated(...args: unknown[]) {
    cartCount.value = extractCartCount(args[0]);
  }

  function handleStateChanged() {
    if (!activeService || !isLoadingHistory.value) {
      return;
    }

    syncMessagesFromService(activeService);
  }

  function handleHistoryLoaded() {
    clearHistoryLoadedTimer();
    // getHistory emits this before merging into state; wait a tick so messages exist.
    historyLoadedTimer = setTimeout(() => {
      historyLoadedTimer = null;
      finishHistoryLoading();
    }, 0);
  }

  function handleServiceError() {
    finishHistoryLoading();
  }

  function unsubscribe(service: WeniWebchatService) {
    clearHistoryLoadedTimer();
    service.off(SERVICE_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    service.off(SERVICE_EVENTS.MESSAGE_SENT, handleMessageSent);
    service.off(SERVICE_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    service.off(SERVICE_EVENTS.THINKING_START, handleThinkingStart);
    service.off(SERVICE_EVENTS.THINKING_STOP, handleThinkingStop);
    service.off(SERVICE_EVENTS.TYPING_START, handleTypingStart);
    service.off(SERVICE_EVENTS.TYPING_STOP, handleTypingStop);
    service.off(SERVICE_EVENTS.CART_UPDATED, handleCartUpdated);
    service.off(SERVICE_EVENTS.STATE_CHANGED, handleStateChanged);
    service.off(SERVICE_EVENTS.HISTORY_LOADED, handleHistoryLoaded);
    service.off(SERVICE_EVENTS.ERROR, handleServiceError);
  }

  function subscribe(service: WeniWebchatService) {
    service.on(SERVICE_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    service.on(SERVICE_EVENTS.MESSAGE_SENT, handleMessageSent);
    service.on(SERVICE_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    service.on(SERVICE_EVENTS.THINKING_START, handleThinkingStart);
    service.on(SERVICE_EVENTS.THINKING_STOP, handleThinkingStop);
    service.on(SERVICE_EVENTS.TYPING_START, handleTypingStart);
    service.on(SERVICE_EVENTS.TYPING_STOP, handleTypingStop);
    service.on(SERVICE_EVENTS.CART_UPDATED, handleCartUpdated);
    service.on(SERVICE_EVENTS.STATE_CHANGED, handleStateChanged);
    service.on(SERVICE_EVENTS.HISTORY_LOADED, handleHistoryLoaded);
    service.on(SERVICE_EVENTS.ERROR, handleServiceError);
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
    isLoadingHistory.value = !service.isConnected();
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
    isTyping,
    isLoadingHistory,
    cartCount,
    suggestions,
    sendMessage,
  };
}
