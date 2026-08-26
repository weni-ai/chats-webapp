import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { SERVICE_EVENTS } from '@weni/webchat-service';

import { useCopilotChat } from '../useCopilotChat';
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
import type { CopilotConnection } from '@/services/api/resources/chats/copilot';

const listeners = new Map<string, Set<(..._args: unknown[]) => void>>();

const serviceMock = {
  getMessages: vi.fn(() => []),
  sendMessage: vi.fn(),
  isConnected: vi.fn(() => false),
  on: vi.fn((event: string, cb: (..._args: unknown[]) => void) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)?.add(cb);
  }),
  off: vi.fn((event: string, cb: (..._args: unknown[]) => void) => {
    listeners.get(event)?.delete(cb);
  }),
};

vi.mock('@/services/copilot/copilotSocketManager', () => ({
  copilotSocketManager: {
    getOrCreateService: vi.fn(() => serviceMock),
    scheduleEviction: vi.fn(),
  },
}));

vi.mock('@weni/webchat-service', () => ({
  SERVICE_EVENTS: {
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_SENT: 'message:sent',
    THINKING_START: 'thinking:start',
    THINKING_STOP: 'thinking:stop',
    CART_UPDATED: 'cart:updated',
    STATE_CHANGED: 'state:changed',
    HISTORY_LOADED: 'history:loaded',
    ERROR: 'error',
  },
}));

const connectionValue: CopilotConnection = {
  socketUrl: 'wss://example.com',
  channelUuid: 'channel-1',
  host: 'https://flows.weni.ai',
  connectOn: 'mount',
  storage: 'local',
  callbackUrl: '',
};

function emit(event: string, payload?: unknown) {
  listeners.get(event)?.forEach((cb) => cb(payload));
}

describe('useCopilotChat', () => {
  beforeEach(() => {
    listeners.clear();
    vi.clearAllMocks();
    serviceMock.getMessages.mockReturnValue([]);
    serviceMock.isConnected.mockReturnValue(false);
  });

  afterEach(() => {
    listeners.clear();
  });

  it('subscribes to service events and maps received messages', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const { messages, suggestions } = useCopilotChat(connection, roomUuid);

    await nextTick();

    expect(copilotSocketManager.getOrCreateService).toHaveBeenCalledWith(
      'room-1',
      connectionValue,
    );

    emit(SERVICE_EVENTS.MESSAGE_RECEIVED, {
      id: 'ai-1',
      type: 'text',
      text: 'Suggestion intro',
      timestamp: 1,
      direction: 'incoming',
      status: 'delivered',
      quick_replies: ['Ask about color'],
    });

    expect(messages.value).toHaveLength(1);
    expect(messages.value[0].direction).toBe('ai');
    expect(suggestions.value).toEqual(['Ask about color']);
  });

  it('updates thinking and cart count from service events', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const { isThinking, cartCount } = useCopilotChat(connection, roomUuid);

    await nextTick();

    emit(SERVICE_EVENTS.THINKING_START);
    expect(isThinking.value).toBe(true);

    emit(SERVICE_EVENTS.THINKING_STOP);
    expect(isThinking.value).toBe(false);

    emit(SERVICE_EVENTS.CART_UPDATED, { count: 3 });
    expect(cartCount.value).toBe(3);
  });

  it('sends messages through the active service', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const { sendMessage } = useCopilotChat(connection, roomUuid);

    await nextTick();

    sendMessage('  Hello assistant  ');
    expect(serviceMock.sendMessage).toHaveBeenCalledWith('Hello assistant');
  });

  it('creates a new service and resets messages when the room changes', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const { messages } = useCopilotChat(connection, roomUuid);

    await nextTick();

    emit(SERVICE_EVENTS.MESSAGE_RECEIVED, {
      id: 'ai-1',
      type: 'text',
      text: 'From room 1',
      timestamp: 1,
      direction: 'incoming',
      status: 'delivered',
    });

    expect(messages.value).toHaveLength(1);

    roomUuid.value = 'room-2';
    await nextTick();

    expect(copilotSocketManager.scheduleEviction).toHaveBeenCalledWith(
      'room-1',
      connectionValue,
    );
    expect(copilotSocketManager.getOrCreateService).toHaveBeenCalledWith(
      'room-2',
      connectionValue,
    );
    expect(messages.value).toEqual([]);
  });

  it('syncs restored history into the visible messages', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const { messages, isLoadingHistory } = useCopilotChat(connection, roomUuid);

    await nextTick();

    expect(isLoadingHistory.value).toBe(true);

    serviceMock.getMessages.mockReturnValue([
      {
        id: 'ai-1',
        type: 'text',
        text: 'From history',
        timestamp: 1,
        direction: 'incoming',
        status: 'delivered',
      },
    ]);

    emit(SERVICE_EVENTS.STATE_CHANGED);

    expect(messages.value).toHaveLength(1);
    expect(messages.value[0].text).toBe('From history');
    expect(isLoadingHistory.value).toBe(true);

    emit(SERVICE_EVENTS.HISTORY_LOADED);
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(isLoadingHistory.value).toBe(false);
  });

  it('skips the history loading state when the service is already connected', async () => {
    serviceMock.isConnected.mockReturnValue(true);
    serviceMock.getMessages.mockReturnValue([
      {
        id: 'ai-1',
        type: 'text',
        text: 'Already in memory',
        timestamp: 1,
        direction: 'incoming',
        status: 'delivered',
      },
    ]);

    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const { messages, isLoadingHistory } = useCopilotChat(connection, roomUuid);

    await nextTick();

    expect(isLoadingHistory.value).toBe(false);
    expect(messages.value[0].text).toBe('Already in memory');
  });
});
