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
    voiceMode?: {
      enabled?: boolean;
      [key: string]: unknown;
    };
  };

  export type FileConfig = {
    allowedTypes: string[];
    maxFileSize: number;
    acceptAttribute: string;
  };

  export type VoiceTokens = {
    sttToken: string;
    ttsToken: string;
  };

  export type SendAudioPayload = {
    base64: string;
    duration?: number;
    mimeType?: string;
    size?: number;
  };

  export type ProductCarouselItem = {
    product_retailer_id: string;
    name: string;
    price: string | number;
    image: string;
    sale_price?: string | number;
    currency?: string;
    description?: string;
    seller_id?: string;
    product_url?: string;
  };

  export type OrderProductItem = ProductCarouselItem & {
    quantity: number;
  };

  export type Message = {
    id: string;
    type: string;
    text?: string;
    media?: string;
    timestamp: number;
    direction: 'incoming' | 'outgoing';
    status: string;
    quick_replies?: Array<string | { title?: string; text?: string }>;
    metadata?: Record<string, unknown> & {
      filename?: string;
      mimeType?: string;
      size?: number;
      duration?: number;
      suggestion?: string;
    };
    product_carousel?: {
      text?: string;
      product_items?: ProductCarouselItem[];
    };
    order?: {
      product_items?: OrderProductItem[];
    };
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
    RECORDING_STARTED: string;
    RECORDING_STOPPED: string;
    RECORDING_CANCELLED: string;
    RECORDING_TICK: string;
    FILE_PROCESSED: string;
    VOICE_ENABLED: string;
    VOICE_TOKENS_RECEIVED: string;
    VOICE_TOKENS_ERROR: string;
    [key: string]: string;
  };

  export const MESSAGE_TYPES: {
    TEXT: string;
    IMAGE: string;
    VIDEO: string;
    AUDIO: string;
    FILE: string;
    ORDER: string;
    [key: string]: string;
  };

  export default class WeniWebchatService {
    static isAudioRecordingSupported: boolean;

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
    sendAttachment(_file: File): void | Promise<void>;
    sendAudio(_payload: SendAudioPayload): void | Promise<void>;
    sendOrder(_productItems: OrderProductItem[]): Promise<unknown>;
    startRecording(): Promise<void>;
    stopRecording(): Promise<void>;
    cancelRecording(): void;
    hasAudioPermission(): boolean;
    requestAudioPermission(): Promise<boolean>;
    getFileConfig(): FileConfig;
    getAllowedFileTypes(): string[];
    requestVoiceTokens(_timeout?: number): Promise<VoiceTokens>;
    setCustomField(_field: string, _value: unknown): void;
    setSessionId(_id: string): Promise<void>;
    on(_event: string, _cb: (..._args: unknown[]) => void): void;
    off(_event: string, _cb: (..._args: unknown[]) => void): void;
  }
}
