import WeniWebchatService from '@weni/webchat-service';
import type { CopilotConnection } from '@/services/api/resources/chats/copilot';
import env from '@/utils/env';

const DEFAULT_IDLE_TIMEOUT_MS = 120000;

const services = new Map<string, WeniWebchatService>();
const evictionTimers = new Map<string, ReturnType<typeof setTimeout>>();

function buildKey(channelUuid: string, roomUuid: string) {
  return `${channelUuid}:${roomUuid}`;
}

function getIdleTimeoutMs() {
  const parsed = Number(env('COPILOT_IDLE_TIMEOUT_MS'));

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_IDLE_TIMEOUT_MS;
}

function isolateSessionStorage(
  service: WeniWebchatService,
  connection: CopilotConnection,
  roomUuid: string,
) {
  if (!service.session) {
    return;
  }

  // webchat-service restores from a single shared key (`weni:webchat:session`)
  // and ignores `sessionId` when that restore succeeds. Namespace it per room
  // so concurrent instances do not register with the same `from` id.
  service.session.sessionKey = `session:${connection.channelUuid}:${roomUuid}`;
}

function ensureConnected(service: WeniWebchatService, key: string) {
  if (service.isConnected() || service.isConnecting()) {
    return;
  }

  service.connect().catch((error) => {
    console.error(`Failed to reconnect copilot service for ${key}:`, error);
  });
}

function createService(
  connection: CopilotConnection,
  roomUuid: string,
): WeniWebchatService {
  const service = new WeniWebchatService({
    socketUrl: connection.socketUrl,
    channelUuid: connection.channelUuid,
    host: connection.host,
    connectOn: connection.connectOn || 'mount',
    storage: connection.storage || 'local',
    callbackUrl: connection.callbackUrl || '',
    mode: 'live',
    sessionId: roomUuid,
    voiceMode: {
      enabled: true,
    },
  });

  isolateSessionStorage(service, connection, roomUuid);

  return service;
}

function clearEvictionTimer(key: string) {
  const timer = evictionTimers.get(key);

  if (!timer) {
    return;
  }

  clearTimeout(timer);
  evictionTimers.delete(key);
}

function disposeByKey(key: string) {
  clearEvictionTimer(key);

  const service = services.get(key);

  if (!service) {
    return;
  }

  service.destroy();
  services.delete(key);
}

export const copilotSocketManager = {
  getOrCreateService(
    roomUuid: string,
    connection: CopilotConnection,
  ): WeniWebchatService {
    const key = buildKey(connection.channelUuid, roomUuid);
    clearEvictionTimer(key);

    const existingService = services.get(key);

    if (existingService) {
      ensureConnected(existingService, key);
      return existingService;
    }

    const service = createService(connection, roomUuid);
    services.set(key, service);
    service.init().catch((error) => {
      console.error(`Failed to initialize copilot service for ${key}:`, error);
      disposeByKey(key);
    });

    return service;
  },

  setRoomContext(
    roomUuid: string,
    connection: CopilotConnection,
    context: string,
  ) {
    const key = buildKey(connection.channelUuid, roomUuid);
    services.get(key)?.setContext(context);
  },

  scheduleEviction(
    roomUuid: string,
    connection: CopilotConnection,
    delayMs = getIdleTimeoutMs(),
  ) {
    const key = buildKey(connection.channelUuid, roomUuid);

    if (!services.has(key)) {
      return;
    }

    clearEvictionTimer(key);

    const timer = setTimeout(() => {
      disposeByKey(key);
    }, delayMs);

    evictionTimers.set(key, timer);
  },

  disposeService(roomUuid: string, connection: CopilotConnection) {
    disposeByKey(buildKey(connection.channelUuid, roomUuid));
  },

  reset() {
    evictionTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    evictionTimers.clear();

    services.forEach((service) => {
      service.destroy();
    });
    services.clear();
  },
};
