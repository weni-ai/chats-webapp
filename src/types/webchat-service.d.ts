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

  export type Message = {
    id: string;
    type: string;
    text?: string;
    timestamp: number;
    direction: 'incoming' | 'outgoing';
    status: string;
    quick_replies?: Array<string | { title?: string; text?: string }>;
    metadata?: Record<string, unknown>;
  };

  export const SERVICE_EVENTS: {
    MESSAGE_RECEIVED: string;
    MESSAGE_SENT: string;
    THINKING_START: string;
    THINKING_STOP: string;
    CART_UPDATED: string;
    CONNECTION_STATUS_CHANGED: string;
    [key: string]: string;
  };

  export default class WeniWebchatService {
    constructor(_config: ServiceConfig);
    init(): Promise<unknown>;
    destroy(): void;
    setContext(_context: string): void;
    getContext(): string;
    getMessages(): Message[];
    sendMessage(_text: string, _options?: Record<string, unknown>): void;
    on(_event: string, _cb: (..._args: unknown[]) => void): void;
    off(_event: string, _cb: (..._args: unknown[]) => void): void;
  }
}
