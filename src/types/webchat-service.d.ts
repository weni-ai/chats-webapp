declare module '@weni/webchat-service' {
  export type ServiceConfig = {
    socketUrl: string;
    channelUuid: string;
    host?: string;
    connectOn?: string;
    storage?: string;
    callbackUrl?: string;
    mode?: string;
  };

  export default class WeniWebchatService {
    constructor(_config: ServiceConfig);
    init(): Promise<unknown>;
    destroy(): void;
    setContext(_context: string): void;
    getContext(): string;
  }
}
