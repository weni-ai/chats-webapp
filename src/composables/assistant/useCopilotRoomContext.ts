import {
  getCurrentInstance,
  getCurrentScope,
  onScopeDispose,
  onUnmounted,
  watch,
  type Ref,
} from 'vue';

import type { CopilotConnection } from '@/services/api/resources/chats/copilot';
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
import {
  buildRoomContext,
  type RawRoomMessage,
} from '@/services/assistant/roomContext';

type ConnectionRef = Ref<CopilotConnection | undefined>;
type RoomUuidRef = Ref<string | undefined>;
type RoomMessagesRef = Ref<RawRoomMessage[]>;

const CONTEXT_DEBOUNCE_MS = 800;

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

function onTeardown(callback: () => void) {
  if (getCurrentInstance()) {
    onUnmounted(callback);
    return;
  }

  if (getCurrentScope()) {
    onScopeDispose(callback);
  }
}

export function useCopilotRoomContext(
  connection: ConnectionRef,
  roomUuid: RoomUuidRef,
  roomMessages: RoomMessagesRef,
) {
  let lastSentContext: string | null = null;

  function sendContextNow() {
    const currentConnection = connection.value;
    const currentRoomUuid = roomUuid.value;

    if (!currentConnection?.channelUuid || !currentRoomUuid) {
      return;
    }

    const context = buildRoomContext(roomMessages.value);
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

  watch(
    [connection, roomUuid],
    () => {
      lastSentContext = null;
      sendContextNow();
    },
    { immediate: true },
  );

  watch(
    roomMessages,
    () => {
      debouncedSend.run();
    },
    { deep: true },
  );

  onTeardown(() => {
    debouncedSend.cancel();
  });
}
