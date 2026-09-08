import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import { useCopilotRoomContext } from '../useCopilotRoomContext';
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
import type { CopilotConnection } from '@/services/api/resources/chats/copilot';
import type { RawRoomMessage } from '@/services/assistant/roomContext';

vi.mock('@/services/copilot/copilotSocketManager', () => ({
  copilotSocketManager: {
    setRoomContext: vi.fn(),
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

function contactMessage(text: string, uuid = 'msg-1'): RawRoomMessage {
  return {
    uuid,
    text,
    contact: { name: 'Cliente' },
    created_on: '2024-01-01T00:00:00Z',
  };
}

describe('useCopilotRoomContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends context immediately when connection and roomUuid are set', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    useCopilotRoomContext(connection, roomUuid, roomMessages);
    await nextTick();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
      'room-1',
      connectionValue,
      'Contato: Oi',
    );
  });

  it('does not call setRoomContext when connection or roomUuid is missing', async () => {
    const connection = ref<CopilotConnection | undefined>(undefined);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    useCopilotRoomContext(connection, roomUuid, roomMessages);
    await nextTick();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();

    connection.value = connectionValue;
    roomUuid.value = undefined;
    await nextTick();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();
  });

  it('does not resend identical context on the same room', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    useCopilotRoomContext(connection, roomUuid, roomMessages);
    await nextTick();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledTimes(1);

    roomMessages.value = [...roomMessages.value];
    await nextTick();
    vi.advanceTimersByTime(800);
    await nextTick();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledTimes(1);
  });

  it('sends updated context after roomMessages change (debounced)', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    useCopilotRoomContext(connection, roomUuid, roomMessages);
    await nextTick();
    vi.clearAllMocks();

    roomMessages.value = [
      contactMessage('Oi'),
      contactMessage('Tudo bem?', 'msg-2'),
    ];
    await nextTick();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();

    vi.advanceTimersByTime(800);
    await nextTick();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
      'room-1',
      connectionValue,
      'Contato: Oi\nContato: Tudo bem?',
    );
  });

  it('resets last sent context and sends immediately when room changes', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Sala 1')]);

    useCopilotRoomContext(connection, roomUuid, roomMessages);
    await nextTick();
    vi.clearAllMocks();

    roomUuid.value = 'room-2';
    roomMessages.value = [contactMessage('Sala 2')];
    await nextTick();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
      'room-2',
      connectionValue,
      'Contato: Sala 2',
    );
  });

  it('cancels pending debounce on unmount', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    const scope = effectScope();
    scope.run(() => {
      useCopilotRoomContext(connection, roomUuid, roomMessages);
    });

    await nextTick();
    vi.clearAllMocks();

    roomMessages.value = [contactMessage('Nova')];
    await nextTick();

    scope.stop();
    vi.advanceTimersByTime(800);
    await nextTick();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();
  });
});
