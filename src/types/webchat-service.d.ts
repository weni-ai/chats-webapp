declare module '@weni/webchat-service' {
  export type ServiceConfig = {
    socketUrl: string;
    channelUuid: string;
    host?: string;
    connectOn?: string;
    storage?: string;
    callbackUrl?: string;
    mode?: string;
    sessionId?: string;
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
    MESSAGE_UPDATED: string;
    THINKING_START: string;
    THINKING_STOP: string;
    TYPING_START: string;
    TYPING_STOP: string;
    CART_UPDATED: string;
    CONNECTION_STATUS_CHANGED: string;
    HISTORY_LOADED: string;
    STATE_CHANGED: string;
    ERROR: string;
    [key: string]: string;
  };

  export default class WeniWebchatService {
    constructor(_config: ServiceConfig);
    session?: {
      sessionKey: string;
    };
    init(): Promise<unknown>;
    connect(): Promise<unknown>;
    destroy(): void;
    isConnected(): boolean;
    isConnecting(): boolean;
    setContext(_context: string): void;
    getContext(): string;
    getMessages(): Message[];
    sendMessage(_text: string, _options?: Record<string, unknown>): void;
    setSessionId(_id: string): Promise<void>;
    on(_event: string, _cb: (..._args: unknown[]) => void): void;
    off(_event: string, _cb: (..._args: unknown[]) => void): void;
  }
}
