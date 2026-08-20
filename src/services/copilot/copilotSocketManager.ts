import WeniWebchatService from '@weni/webchat-service';
import type { CopilotConnection } from '@/services/api/resources/chats/copilot';

const services = new Map<string, WeniWebchatService>();

function createService(connection: CopilotConnection): WeniWebchatService {
  return new WeniWebchatService({
    socketUrl: connection.socketUrl,
    channelUuid: connection.channelUuid,
    host: connection.host,
    connectOn: connection.connectOn || 'mount',
    storage: connection.storage || 'local',
    callbackUrl: connection.callbackUrl || '',
    mode: 'live',
  });
}

export const copilotSocketManager = {
  getOrCreateService(
    channelUuid: string,
    connection: CopilotConnection,
  ): WeniWebchatService {
    const existingService = services.get(channelUuid);

    if (existingService) {
      return existingService;
    }

    const service = createService({
      ...connection,
      channelUuid,
    });

    services.set(channelUuid, service);
    void service.init();

    return service;
  },

  setRoomContext(channelUuid: string, context: string) {
    const service = services.get(channelUuid);
    service?.setContext(context);
  },

  disposeService(channelUuid: string) {
    const service = services.get(channelUuid);

    if (!service) {
      return;
    }

    service.destroy();
    services.delete(channelUuid);
  },

  reset() {
    services.forEach((service) => {
      service.destroy();
    });
    services.clear();
  },
};
