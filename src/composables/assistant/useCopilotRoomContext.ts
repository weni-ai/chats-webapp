import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue';

import type { CopilotConnection } from '@/services/api/resources/chats/copilot';
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
import {
  buildRoomContext,
  type RawRoomMessage,
} from '@/services/assistant/roomContext';
import {
  buildUnansweredTrigger,
  findUnansweredMessages,
  hasInProgressAudioTranscription,
} from '@/services/assistant/unansweredMessages';
import { getLastProcessed, markProcessed } from '@/utils/copilotReadStorage';

type ConnectionRef = Ref<CopilotConnection | undefined>;
type RoomUuidRef = Ref<string | undefined>;
type RoomMessagesRef = Ref<RawRoomMessage[]>;

export type CopilotReadStorageScope = {
  projectUuid?: string;
  agentEmail?: string;
  channelUuid?: string;
};

export type UseCopilotRoomContextOptions = {
  connection: ConnectionRef;
  roomUuid: RoomUuidRef;
  roomMessages: RoomMessagesRef;
  messagesRoomUuid?: Ref<string | undefined>;
  enabled?: Ref<boolean>;
  isReady?: Ref<boolean>;
  isBusy?: Ref<boolean>;
  sendHiddenMessage?: (_text: string) => Promise<void>;
  storageScope?: Ref<CopilotReadStorageScope>;
};

const CONTEXT_DEBOUNCE_MS = 800;
const BURST_SILENCE_MS = 3000;
const BURST_MAX_MS = 15000;
const TRANSCRIPTION_WAIT_MS = 10000;

function createDebouncedFn(fn: () => void, waitMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const run = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, waitMs);
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return { run, cancel };
}

function processedPayload(pending: RawRoomMessage[]) {
  const lastMessage = pending.at(-1);
  if (!lastMessage?.uuid) {
    return null;
  }

  return {
    messageUuid: lastMessage.uuid,
    createdOn: lastMessage.created_on || '',
    processedUuids: pending
      .map((message) => message.uuid)
      .filter((uuid): uuid is string => !!uuid),
  };
}

export function useCopilotRoomContext({
  connection,
  roomUuid,
  roomMessages,
  messagesRoomUuid = ref<string | undefined>(undefined),
  enabled = ref(false),
  isReady = ref(true),
  isBusy = ref(false),
  sendHiddenMessage,
  storageScope = ref({}),
}: UseCopilotRoomContextOptions) {
  let lastSentContext: string | null = null;
  let inFlight = false;
  let alreadyEligible = false;
  let queuedRetry = false;
  let awaitingInitialLoad = true;
  let hasBoundRoom = false;
  let burstSilenceTimer: ReturnType<typeof setTimeout> | null = null;
  let burstMaxTimer: ReturnType<typeof setTimeout> | null = null;
  let transcriptionTimer: ReturnType<typeof setTimeout> | null = null;
  let transcriptionWaitElapsed = false;

  function getScopedMessages() {
    const currentRoomUuid = roomUuid.value;
    if (!currentRoomUuid) {
      return [];
    }

    const loadedRoomUuid = messagesRoomUuid.value;
    if (loadedRoomUuid && loadedRoomUuid !== currentRoomUuid) {
      return [];
    }

    return roomMessages.value.filter(
      (message) => !message.room || message.room === currentRoomUuid,
    );
  }

  function hasCompleteScope() {
    const scope = storageScope.value;
    return !!(scope?.projectUuid && scope?.agentEmail && scope?.channelUuid);
  }

  function sendContextNow() {
    const currentConnection = connection.value;
    const currentRoomUuid = roomUuid.value;

    if (!isReady.value || !currentConnection?.channelUuid || !currentRoomUuid) {
      return;
    }

    const context = buildRoomContext(getScopedMessages());
    if (!context || context === lastSentContext) {
      return;
    }

    copilotSocketManager.setRoomContext(
      currentRoomUuid,
      currentConnection,
      context,
    );
    lastSentContext = context;
  }

  const debouncedSend = createDebouncedFn(sendContextNow, CONTEXT_DEBOUNCE_MS);

  function cancelBurstTimers() {
    if (burstSilenceTimer) {
      clearTimeout(burstSilenceTimer);
      burstSilenceTimer = null;
    }

    if (burstMaxTimer) {
      clearTimeout(burstMaxTimer);
      burstMaxTimer = null;
    }
  }

  function cancelTranscriptionTimer() {
    if (transcriptionTimer) {
      clearTimeout(transcriptionTimer);
      transcriptionTimer = null;
    }
    transcriptionWaitElapsed = false;
  }

  function cancelAllTimers() {
    cancelBurstTimers();
    cancelTranscriptionTimer();
    debouncedSend.cancel();
  }

  function canRunProactive() {
    return (
      !!enabled.value &&
      !!isReady.value &&
      !!connection.value?.channelUuid &&
      !!roomUuid.value &&
      typeof sendHiddenMessage === 'function' &&
      hasCompleteScope()
    );
  }

  function getPending() {
    const lastProcessed = getLastProcessed(storageScope.value, roomUuid.value);
    return findUnansweredMessages(getScopedMessages(), lastProcessed);
  }

  function scheduleBurst() {
    if (!burstMaxTimer) {
      burstMaxTimer = setTimeout(() => {
        burstMaxTimer = null;
        void tryFire();
      }, BURST_MAX_MS);
    }

    if (burstSilenceTimer) {
      clearTimeout(burstSilenceTimer);
    }

    burstSilenceTimer = setTimeout(() => {
      burstSilenceTimer = null;
      void tryFire();
    }, BURST_SILENCE_MS);
  }

  async function fire(pending: RawRoomMessage[]) {
    const currentConnection = connection.value;
    const currentRoomUuid = roomUuid.value;

    if (
      !currentConnection?.channelUuid ||
      !currentRoomUuid ||
      typeof sendHiddenMessage !== 'function'
    ) {
      return;
    }

    inFlight = true;

    try {
      const trigger = buildUnansweredTrigger(pending);
      if (
        roomUuid.value !== currentRoomUuid ||
        connection.value?.channelUuid !== currentConnection.channelUuid
      ) {
        return;
      }

      sendContextNow();
      await sendHiddenMessage(trigger);

      if (
        roomUuid.value !== currentRoomUuid ||
        connection.value?.channelUuid !== currentConnection.channelUuid
      ) {
        return;
      }

      const payload = processedPayload(pending);
      if (payload) {
        markProcessed(storageScope.value, currentRoomUuid, payload);
      }
    } catch (error) {
      console.error(
        `Failed to fire copilot proactive processing for ${currentRoomUuid}:`,
        error,
      );
    } finally {
      inFlight = false;
      if (queuedRetry) {
        queuedRetry = false;
        void tryFire();
      }
    }
  }

  async function tryFire() {
    if (inFlight || isBusy.value || !canRunProactive()) {
      if (inFlight || isBusy.value) {
        queuedRetry = true;
      }
      return;
    }

    const pending = getPending();
    if (!pending.length) {
      cancelBurstTimers();
      cancelTranscriptionTimer();
      return;
    }

    if (hasInProgressAudioTranscription(pending) && !transcriptionWaitElapsed) {
      if (!transcriptionTimer) {
        transcriptionTimer = setTimeout(() => {
          transcriptionTimer = null;
          transcriptionWaitElapsed = true;
          void tryFire();
        }, TRANSCRIPTION_WAIT_MS);
      }
      return;
    }

    cancelBurstTimers();
    cancelTranscriptionTimer();
    await fire(pending);
  }

  function markContextAsProcessed() {
    const currentRoomUuid = roomUuid.value;
    const pending = getPending();
    const payload = processedPayload(pending);

    if (!currentRoomUuid || !payload) {
      return;
    }

    markProcessed(storageScope.value, currentRoomUuid, payload);
    cancelBurstTimers();
    cancelTranscriptionTimer();
  }

  watch(
    [connection, roomUuid, enabled, isReady, isBusy, messagesRoomUuid],
    (_current, previous) => {
      const previousConnection = previous?.[0];
      const previousRoomUuid = previous?.[1];
      const roomChanged =
        hasBoundRoom &&
        (connection.value !== previousConnection ||
          roomUuid.value !== previousRoomUuid);
      hasBoundRoom = true;

      if (roomChanged) {
        lastSentContext = null;
        alreadyEligible = false;
        awaitingInitialLoad = true;
        cancelBurstTimers();
        cancelTranscriptionTimer();
      }

      sendContextNow();

      if (!enabled.value) {
        alreadyEligible = false;
        cancelBurstTimers();
        cancelTranscriptionTimer();
        return;
      }

      if (!isReady.value) {
        alreadyEligible = false;
        return;
      }

      if (isBusy.value) {
        cancelBurstTimers();
        return;
      }

      alreadyEligible = true;

      if (awaitingInitialLoad) {
        if (getScopedMessages().length) {
          awaitingInitialLoad = false;
          void tryFire();
        }
        return;
      }

      void tryFire();
    },
    { immediate: true },
  );

  watch(
    roomMessages,
    () => {
      const scopedMessages = getScopedMessages();

      if (!scopedMessages.length) {
        cancelBurstTimers();
        cancelTranscriptionTimer();
        lastSentContext = null;
        debouncedSend.run();
        return;
      }

      debouncedSend.run();

      if (awaitingInitialLoad) {
        awaitingInitialLoad = false;
        void tryFire();
        return;
      }

      if (!canRunProactive()) {
        return;
      }

      const pending = getPending();
      if (!pending.length) {
        cancelBurstTimers();
        cancelTranscriptionTimer();
        return;
      }

      if (isBusy.value) {
        return;
      }

      if (transcriptionTimer) {
        if (!hasInProgressAudioTranscription(pending)) {
          void tryFire();
        }
        return;
      }

      if (alreadyEligible) {
        scheduleBurst();
      }
    },
    { deep: true },
  );

  if (getCurrentScope()) {
    onScopeDispose(() => {
      cancelAllTimers();
    });
  }

  return {
    markContextAsProcessed,
  };
}
