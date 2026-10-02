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
  type FileConfig,
  type Message,
} from '@weni/webchat-service';

import type { CopilotConnection } from '@/services/api/resources/chats/copilot';
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
import { extractCartCount } from '@/services/assistant/cartCount';
import { mapServiceMessage } from '@/services/assistant/messageMapper';
import { isUnansweredTrigger } from '@/services/assistant/unansweredMessages';
import type {
  AssistantMessage,
  OrderProductItem,
} from '@/services/assistant/types';

type ConnectionRef = Ref<CopilotConnection | undefined>;
type RoomUuidRef = Ref<string | undefined>;
type AgentEmailRef = Ref<string | undefined>;
type ContactUrnRef = Ref<string | undefined>;
type OriginProjectUuidRef = Ref<string | undefined>;

const SELLER_EMAIL_CUSTOM_FIELD = 'seller_email';
const ORIGINAL_CONTACT_URN_CUSTOM_FIELD = 'original_contact_urn';
const ORIGIN_PROJECT_UUID_CUSTOM_FIELD = 'origin_project_uuid';

const DEFAULT_FILE_CONFIG: FileConfig = {
  allowedTypes: [],
  maxFileSize: 32 * 1024 * 1024,
  acceptAttribute: '',
};

export function useCopilotChat(
  connection: ConnectionRef,
  roomUuid: RoomUuidRef,
  agentEmail: AgentEmailRef = ref(undefined),
  originalContactUrn: ContactUrnRef = ref(undefined),
  originProjectUuid: OriginProjectUuidRef = ref(undefined),
) {
  const messages = ref<AssistantMessage[]>([]);
  const isThinking = ref(false);
  const isTyping = ref(false);
  const cartCount = ref(0);
  const isLoadingHistory = ref(false);
  const isConnected = ref(false);
  const isRecording = ref(false);
  const recordingDurationMs = ref(0);
  const isAudioRecordingSupported = ref(
    !!WeniWebchatService.isAudioRecordingSupported,
  );
  const isVoiceEnabledByServer = ref(false);
  const fileConfig = ref<FileConfig>({ ...DEFAULT_FILE_CONFIG });
  const lastStreamingText = ref('');

  let activeService: WeniWebchatService | null = null;
  let activeChannelUuid: string | null = null;
  let activeRoomUuid: string | null = null;
  let activeConnection: CopilotConnection | null = null;
  let historyLoadedTimer: ReturnType<typeof setTimeout> | null = null;
  // webchat-service 1.17.2 times out getHistory after 30s without emitting
  // HISTORY_LOADED or ERROR (the timeout lives on the internal history
  // object). Local mocks that ignore get_history would otherwise keep the
  // skeleton forever after CONNECTED sets isLoadingHistory.
  const HISTORY_LOAD_FALLBACK_MS = 5000;
  let historyFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingHiddenSend: {
    text: string;
    resolve: () => void;
    reject: (_error: unknown) => void;
  } | null = null;

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
    isConnected.value = false;
    isRecording.value = false;
    recordingDurationMs.value = 0;
    isVoiceEnabledByServer.value = false;
    fileConfig.value = { ...DEFAULT_FILE_CONFIG };
    lastStreamingText.value = '';
  }

  function clearHistoryLoadedTimer() {
    if (!historyLoadedTimer) {
      return;
    }

    clearTimeout(historyLoadedTimer);
    historyLoadedTimer = null;
  }

  function clearHistoryFallbackTimer() {
    if (!historyFallbackTimer) {
      return;
    }

    clearTimeout(historyFallbackTimer);
    historyFallbackTimer = null;
  }

  function startHistoryFallback() {
    clearHistoryFallbackTimer();
    historyFallbackTimer = setTimeout(() => {
      historyFallbackTimer = null;
      finishHistoryLoading();
    }, HISTORY_LOAD_FALLBACK_MS);
  }

  function finishHistoryLoading() {
    clearHistoryLoadedTimer();
    clearHistoryFallbackTimer();

    if (activeService) {
      syncMessagesFromService(activeService);
    }

    isLoadingHistory.value = false;
  }

  function isHiddenTriggerMessage(mapped: AssistantMessage) {
    return mapped.direction === 'human' && isUnansweredTrigger(mapped.text);
  }

  function syncMessagesFromService(service: WeniWebchatService) {
    messages.value = service
      .getMessages()
      .map(mapServiceMessage)
      .filter((mapped) => !isHiddenTriggerMessage(mapped));
  }

  function syncFileConfig(service: WeniWebchatService) {
    try {
      fileConfig.value = service.getFileConfig?.() || {
        ...DEFAULT_FILE_CONFIG,
      };
    } catch {
      fileConfig.value = { ...DEFAULT_FILE_CONFIG };
    }
  }

  function upsertMappedMessage(mapped: AssistantMessage) {
    if (isHiddenTriggerMessage(mapped)) {
      return;
    }

    const existingIndex = messages.value.findIndex(
      (item) => item.id === mapped.id,
    );

    if (existingIndex >= 0) {
      messages.value.splice(existingIndex, 1, mapped);
    } else {
      messages.value.push(mapped);
    }

    if (mapped.direction === 'ai' && mapped.status === 'streaming') {
      lastStreamingText.value = mapped.text || mapped.suggestion || '';
    } else if (mapped.direction === 'ai' && mapped.status !== 'streaming') {
      lastStreamingText.value = mapped.text || mapped.suggestion || '';
    }
  }

  function handleMessageReceived(...args: unknown[]) {
    const message = args[0] as Message;
    if (!message?.id) {
      return;
    }

    upsertMappedMessage(mapServiceMessage(message));
  }

  function handleMessageSent(...args: unknown[]) {
    const message = args[0] as Message;

    if (
      pendingHiddenSend &&
      message?.hidden &&
      message.text === pendingHiddenSend.text
    ) {
      const { resolve } = pendingHiddenSend;
      pendingHiddenSend = null;
      resolve();
    }

    if (message?.hidden) {
      return;
    }

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

  function handleRecordingStarted() {
    isRecording.value = true;
    recordingDurationMs.value = 0;
  }

  function handleRecordingStopped() {
    isRecording.value = false;
    recordingDurationMs.value = 0;
  }

  function handleRecordingCancelled() {
    isRecording.value = false;
    recordingDurationMs.value = 0;
  }

  function handleRecordingTick(...args: unknown[]) {
    const duration = args[0];
    if (typeof duration === 'number') {
      recordingDurationMs.value = duration;
      return;
    }

    if (
      duration &&
      typeof duration === 'object' &&
      typeof (duration as { duration?: number }).duration === 'number'
    ) {
      recordingDurationMs.value = (duration as { duration: number }).duration;
    }
  }

  function handleVoiceEnabled() {
    isVoiceEnabledByServer.value = true;
  }

  function handleStateChanged() {
    if (!activeService || !isLoadingHistory.value) {
      return;
    }

    syncMessagesFromService(activeService);
  }

  function handleHistoryLoaded() {
    clearHistoryLoadedTimer();
    historyLoadedTimer = setTimeout(() => {
      historyLoadedTimer = null;
      finishHistoryLoading();
    }, 0);
  }

  function handleServiceError(...args: unknown[]) {
    if (pendingHiddenSend) {
      const { reject } = pendingHiddenSend;
      pendingHiddenSend = null;
      reject(args[0] ?? new Error('Copilot service error'));
    }

    finishHistoryLoading();
  }

  function handleConnected() {
    isConnected.value = true;
    isLoadingHistory.value = true;
    startHistoryFallback();
  }

  function handleDisconnected() {
    isConnected.value = false;
  }

  function handleReconnectScheduled() {
    isConnected.value = false;
  }

  function rejectPendingHiddenSend(error: unknown) {
    if (!pendingHiddenSend) {
      return;
    }

    const { reject } = pendingHiddenSend;
    pendingHiddenSend = null;
    reject(error);
  }

  function unsubscribe(service: WeniWebchatService) {
    clearHistoryLoadedTimer();
    clearHistoryFallbackTimer();
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
    service.off(SERVICE_EVENTS.CONNECTED, handleConnected);
    service.off(SERVICE_EVENTS.DISCONNECTED, handleDisconnected);
    service.off(SERVICE_EVENTS.RECONNECT_SCHEDULED, handleReconnectScheduled);
    service.off(SERVICE_EVENTS.RECORDING_STARTED, handleRecordingStarted);
    service.off(SERVICE_EVENTS.RECORDING_STOPPED, handleRecordingStopped);
    service.off(SERVICE_EVENTS.RECORDING_CANCELLED, handleRecordingCancelled);
    service.off(SERVICE_EVENTS.RECORDING_TICK, handleRecordingTick);
    service.off(SERVICE_EVENTS.VOICE_ENABLED, handleVoiceEnabled);
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
    service.on(SERVICE_EVENTS.CONNECTED, handleConnected);
    service.on(SERVICE_EVENTS.DISCONNECTED, handleDisconnected);
    service.on(SERVICE_EVENTS.RECONNECT_SCHEDULED, handleReconnectScheduled);
    service.on(SERVICE_EVENTS.RECORDING_STARTED, handleRecordingStarted);
    service.on(SERVICE_EVENTS.RECORDING_STOPPED, handleRecordingStopped);
    service.on(SERVICE_EVENTS.RECORDING_CANCELLED, handleRecordingCancelled);
    service.on(SERVICE_EVENTS.RECORDING_TICK, handleRecordingTick);
    service.on(SERVICE_EVENTS.VOICE_ENABLED, handleVoiceEnabled);
  }

  function detachCurrentView() {
    rejectPendingHiddenSend(new Error('Copilot service detached'));

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

  function applySessionCustomFields(service: WeniWebchatService) {
    const email = agentEmail.value?.trim();
    if (email) {
      service.setCustomField(SELLER_EMAIL_CUSTOM_FIELD, email);
    }

    const contactUrn = originalContactUrn.value?.trim();
    if (contactUrn) {
      service.setCustomField(ORIGINAL_CONTACT_URN_CUSTOM_FIELD, contactUrn);
    }

    const originUuid = originProjectUuid.value?.trim();
    if (originUuid) {
      service.setCustomField(ORIGIN_PROJECT_UUID_CUSTOM_FIELD, originUuid);
    }
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
    applySessionCustomFields(service);
    syncMessagesFromService(service);
    syncFileConfig(service);
    isConnected.value = service.isConnected();
    isLoadingHistory.value = !service.isConnected();
    isAudioRecordingSupported.value =
      !!WeniWebchatService.isAudioRecordingSupported;
  }

  function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || !activeService) {
      return;
    }

    activeService.sendMessage(trimmed);
  }

  function sendHiddenMessage(text: string): Promise<void> {
    const trimmed = text.trim();

    if (!trimmed || !activeService) {
      return Promise.reject(new Error('Copilot service is not connected'));
    }

    if (pendingHiddenSend) {
      pendingHiddenSend.reject(new Error('Replaced by a new hidden message'));
      pendingHiddenSend = null;
    }

    return new Promise((resolve, reject) => {
      pendingHiddenSend = { text: trimmed, resolve, reject };
      activeService?.sendMessage(trimmed, { hidden: true });
    });
  }

  async function sendOrder(productItems: OrderProductItem[]) {
    if (
      !activeService ||
      !Array.isArray(productItems) ||
      productItems.length === 0
    ) {
      return;
    }

    await activeService.sendOrder(productItems);
  }

  async function sendAttachment(file: File) {
    if (!file || !activeService) {
      return;
    }

    await activeService.sendAttachment(file);
  }

  async function startRecording() {
    if (!activeService) {
      return;
    }

    await activeService.startRecording();
  }

  async function stopRecording() {
    if (!activeService) {
      return;
    }

    await activeService.stopRecording();
  }

  function cancelRecording() {
    if (!activeService) {
      return;
    }

    activeService.cancelRecording();
  }

  async function requestVoiceTokens(timeout?: number) {
    if (!activeService) {
      throw new Error('Copilot service is not connected');
    }

    return activeService.requestVoiceTokens(timeout);
  }

  function getActiveService() {
    return activeService;
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

  watch([agentEmail, originalContactUrn, originProjectUuid], () => {
    if (!activeService) {
      return;
    }

    applySessionCustomFields(activeService);
  });

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
    isConnected,
    cartCount,
    suggestions,
    isRecording,
    recordingDurationMs,
    isAudioRecordingSupported,
    isVoiceEnabledByServer,
    fileConfig,
    lastStreamingText,
    sendMessage,
    sendHiddenMessage,
    sendOrder,
    sendAttachment,
    startRecording,
    stopRecording,
    cancelRecording,
    requestVoiceTokens,
    getActiveService,
  };
}
