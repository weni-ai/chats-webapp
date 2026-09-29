import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import { useCopilotRoomContext } from '../useCopilotRoomContext';
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
import type { CopilotConnection } from '@/services/api/resources/chats/copilot';
import type { RawRoomMessage } from '@/services/assistant/roomContext';
import { UNANSWERED_TRIGGER_PREFIX } from '@/services/assistant/unansweredMessages';
import { markProcessed } from '@/utils/copilotReadStorage';

const processedByRoom: Record<
  string,
  {
    messageUuid: string;
    createdOn: string;
    processedAt: number;
    processedUuids?: string[];
  }
> = {};

vi.mock('@/services/copilot/copilotSocketManager', () => ({
  copilotSocketManager: {
    setRoomContext: vi.fn(),
  },
}));

vi.mock('@/utils/copilotReadStorage', () => ({
  getLastProcessed: vi.fn(
    (_scope: unknown, roomUuid: string) => processedByRoom[roomUuid] || null,
  ),
  getProcessedUuids: vi.fn(
    (_scope: unknown, roomUuid: string) =>
      processedByRoom[roomUuid]?.processedUuids || [],
  ),
  markProcessed: vi.fn(
    (
      _scope: unknown,
      roomUuid: string,
      payload: {
        messageUuid: string;
        createdOn?: string;
        processedUuids?: string[];
      },
    ) => {
      processedByRoom[roomUuid] = {
        messageUuid: payload.messageUuid,
        createdOn: payload.createdOn || '',
        processedAt: Date.now(),
        processedUuids: payload.processedUuids || [payload.messageUuid],
      };
    },
  ),
  clearRoom: vi.fn(),
}));

const connectionValue: CopilotConnection = {
  socketUrl: 'wss://example.com',
  channelUuid: 'channel-1',
  host: 'https://flows.weni.ai',
  connectOn: 'mount',
  storage: 'local',
  callbackUrl: '',
};

const storageScopeValue = {
  projectUuid: 'project-1',
  agentEmail: 'agent@example.com',
  channelUuid: 'channel-1',
};

function contactMessage(
  text: string,
  uuid = 'msg-1',
  createdOn = '2024-01-01T00:00:00Z',
  room = 'room-1',
): RawRoomMessage {
  return {
    uuid,
    text,
    contact: { name: 'Cliente' },
    created_on: createdOn,
    room,
  };
}

function agentMessage(
  text: string,
  uuid = 'agent-1',
  createdOn = '2024-01-01T00:01:00Z',
  room = 'room-1',
): RawRoomMessage {
  return {
    uuid,
    text,
    user: { email: 'agent@example.com' },
    created_on: createdOn,
    room,
  };
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
}

describe('useCopilotRoomContext', () => {
  beforeEach(() => {
    Object.keys(processedByRoom).forEach((key) => {
      delete processedByRoom[key];
    });
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

    useCopilotRoomContext({ connection, roomUuid, roomMessages });
    await flush();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
      'room-1',
      connectionValue,
      'Contact: Oi',
    );
  });

  it('does not call setRoomContext when connection or roomUuid is missing', async () => {
    const connection = ref<CopilotConnection | undefined>(undefined);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    useCopilotRoomContext({ connection, roomUuid, roomMessages });
    await flush();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();

    connection.value = connectionValue;
    roomUuid.value = undefined;
    await flush();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();
  });

  it('does not send context until isReady is true', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);
    const isReady = ref(false);

    useCopilotRoomContext({ connection, roomUuid, roomMessages, isReady });
    await flush();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();

    isReady.value = true;
    await flush();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
      'room-1',
      connectionValue,
      'Contact: Oi',
    );
  });

  it('does not resend identical context on the same room', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    useCopilotRoomContext({ connection, roomUuid, roomMessages });
    await flush();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledTimes(1);

    roomMessages.value = [...roomMessages.value];
    await flush();
    vi.advanceTimersByTime(800);
    await flush();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledTimes(1);
  });

  it('sends updated context after roomMessages change (debounced)', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    useCopilotRoomContext({ connection, roomUuid, roomMessages });
    await flush();
    vi.clearAllMocks();

    roomMessages.value = [
      contactMessage('Oi'),
      contactMessage('Tudo bem?', 'msg-2'),
    ];
    await flush();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();

    vi.advanceTimersByTime(800);
    await flush();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
      'room-1',
      connectionValue,
      'Contact: Oi\nContact: Tudo bem?',
    );
  });

  it('resets last sent context and sends immediately when room changes', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Sala 1')]);

    useCopilotRoomContext({ connection, roomUuid, roomMessages });
    await flush();
    vi.clearAllMocks();

    roomUuid.value = 'room-2';
    roomMessages.value = [
      contactMessage('Sala 2', 'msg-2', '2024-01-01T00:00:00Z', 'room-2'),
    ];
    await flush();

    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
      'room-2',
      connectionValue,
      'Contact: Sala 2',
    );
  });

  it('cancels pending debounce on unmount', async () => {
    const connection = ref<CopilotConnection | undefined>(connectionValue);
    const roomUuid = ref<string | undefined>('room-1');
    const roomMessages = ref<RawRoomMessage[]>([contactMessage('Oi')]);

    const scope = effectScope();
    scope.run(() => {
      useCopilotRoomContext({ connection, roomUuid, roomMessages });
    });

    await flush();
    vi.clearAllMocks();

    roomMessages.value = [contactMessage('Nova')];
    await flush();

    scope.stop();
    vi.advanceTimersByTime(800);
    await flush();

    expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();
  });

  describe('proactive processing', () => {
    function setup(
      overrides: {
        messages?: RawRoomMessage[];
        enabled?: boolean;
        isReady?: boolean;
        isBusy?: boolean;
        sendHiddenMessage?: ReturnType<typeof vi.fn>;
        storageScope?: typeof storageScopeValue;
      } = {},
    ) {
      const connection = ref<CopilotConnection | undefined>(connectionValue);
      const roomUuid = ref<string | undefined>('room-1');
      const roomMessages = ref<RawRoomMessage[]>(overrides.messages || []);
      const enabled = ref(overrides.enabled ?? true);
      const isReady = ref(overrides.isReady ?? true);
      const isBusy = ref(overrides.isBusy ?? false);
      const sendHiddenMessage =
        overrides.sendHiddenMessage || vi.fn().mockResolvedValue(undefined);
      const storageScope = ref(
        overrides.storageScope || { ...storageScopeValue },
      );

      const orchestrator = useCopilotRoomContext({
        connection,
        roomUuid,
        roomMessages,
        enabled,
        isReady,
        isBusy,
        sendHiddenMessage,
        storageScope,
      });

      return {
        connection,
        roomUuid,
        roomMessages,
        enabled,
        isReady,
        isBusy,
        sendHiddenMessage,
        orchestrator,
      };
    }

    it('fires when the room becomes ready with unanswered messages', async () => {
      const { sendHiddenMessage, isReady } = setup({
        messages: [contactMessage('Oi')],
        isReady: false,
      });

      await flush();
      expect(sendHiddenMessage).not.toHaveBeenCalled();

      isReady.value = true;
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
      expect(sendHiddenMessage.mock.calls[0][0]).toContain(
        UNANSWERED_TRIGGER_PREFIX,
      );
      expect(sendHiddenMessage.mock.calls[0][0]).toContain('Contact: Oi');
      expect(markProcessed).toHaveBeenCalledWith(
        storageScopeValue,
        'room-1',
        expect.objectContaining({ messageUuid: 'msg-1' }),
      );
    });

    it('groups a burst of contact messages into a single processing', async () => {
      const { sendHiddenMessage, roomMessages } = setup();
      await flush();
      expect(sendHiddenMessage).not.toHaveBeenCalled();

      roomMessages.value = [contactMessage('Um', 'msg-1')];
      await flush();
      roomMessages.value = [
        contactMessage('Um', 'msg-1'),
        contactMessage('Dois', 'msg-2', '2024-01-01T00:00:01Z'),
      ];
      await flush();
      roomMessages.value = [
        contactMessage('Um', 'msg-1'),
        contactMessage('Dois', 'msg-2', '2024-01-01T00:00:01Z'),
        contactMessage('Tres', 'msg-3', '2024-01-01T00:00:02Z'),
      ];
      await flush();

      expect(sendHiddenMessage).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
      expect(sendHiddenMessage.mock.calls[0][0]).toContain('Contact: Um');
      expect(sendHiddenMessage.mock.calls[0][0]).toContain('Contact: Dois');
      expect(sendHiddenMessage.mock.calls[0][0]).toContain('Contact: Tres');
    });

    it('fires at most 15s after the first pending message without a 3s pause', async () => {
      const { sendHiddenMessage, roomMessages } = setup();
      await flush();

      roomMessages.value = [contactMessage('Um', 'msg-1')];
      await flush();

      for (let index = 2; index <= 8; index += 1) {
        vi.advanceTimersByTime(2000);
        roomMessages.value = [
          ...roomMessages.value,
          contactMessage(
            `m${index}`,
            `msg-${index}`,
            `2024-01-01T00:00:0${index}Z`,
          ),
        ];
        await flush();
      }

      expect(sendHiddenMessage).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
    });

    it('cancels a scheduled processing when the agent replies', async () => {
      const { sendHiddenMessage, roomMessages } = setup();
      await flush();

      roomMessages.value = [contactMessage('Oi')];
      await flush();

      roomMessages.value = [contactMessage('Oi'), agentMessage('Resposta')];
      await flush();

      vi.advanceTimersByTime(15000);
      await flush();

      expect(sendHiddenMessage).not.toHaveBeenCalled();
    });

    it('waits until the copilot is no longer busy before firing', async () => {
      const { sendHiddenMessage, isBusy } = setup({
        messages: [contactMessage('Oi')],
        isBusy: true,
      });

      await flush();
      vi.advanceTimersByTime(15000);
      await flush();
      expect(sendHiddenMessage).not.toHaveBeenCalled();

      isBusy.value = false;
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
    });

    it('does not reprocess messages already marked as processed', async () => {
      processedByRoom['room-1'] = {
        messageUuid: 'msg-1',
        createdOn: '2024-01-01T00:00:00Z',
        processedAt: 1,
        processedUuids: ['msg-1'],
      };

      const { sendHiddenMessage } = setup({
        messages: [contactMessage('Oi')],
      });
      await flush();
      vi.advanceTimersByTime(15000);
      await flush();

      expect(sendHiddenMessage).not.toHaveBeenCalled();
    });

    it('does not mark messages as processed when sending fails', async () => {
      const sendHiddenMessage = vi
        .fn()
        .mockRejectedValue(new Error('socket down'));
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      setup({
        messages: [contactMessage('Oi')],
        sendHiddenMessage,
      });
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
      expect(markProcessed).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('never fires when enabled is false', async () => {
      const { sendHiddenMessage } = setup({
        messages: [contactMessage('Oi')],
        enabled: false,
      });
      await flush();
      vi.advanceTimersByTime(15000);
      await flush();

      expect(sendHiddenMessage).not.toHaveBeenCalled();
      expect(copilotSocketManager.setRoomContext).toHaveBeenCalled();
    });

    it('marks pending messages as processed when the agent asks copilot', async () => {
      const { orchestrator, sendHiddenMessage } = setup({
        messages: [contactMessage('Oi')],
        enabled: false,
      });
      await flush();

      orchestrator.markContextAsProcessed();

      expect(markProcessed).toHaveBeenCalledWith(
        storageScopeValue,
        'room-1',
        expect.objectContaining({ messageUuid: 'msg-1' }),
      );
      expect(sendHiddenMessage).not.toHaveBeenCalled();
    });

    it('waits up to 10s for in-progress audio transcription before firing', async () => {
      const audioMessage = contactMessage('audio', 'audio-1');
      audioMessage.media = [
        {
          url: 'https://cdn.example/a.mp3',
          content_type: 'audio/mpeg',
          transcription: { status: 'IN_PROGRESS' },
        },
      ];

      const { sendHiddenMessage, roomMessages } = setup({
        messages: [audioMessage],
      });
      await flush();

      expect(sendHiddenMessage).not.toHaveBeenCalled();

      vi.advanceTimersByTime(9999);
      await flush();
      expect(sendHiddenMessage).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
      expect(sendHiddenMessage.mock.calls[0][0]).toContain('[audio]');

      roomMessages.value = [
        {
          ...audioMessage,
          media: [
            {
              url: 'https://cdn.example/a.mp3',
              content_type: 'audio/mpeg',
              transcription: { status: 'DONE', text: 'tarde demais' },
            },
          ],
        },
      ];
      await flush();
      vi.advanceTimersByTime(15000);
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
    });

    it('does not send the previous room context or trigger while messages are stale', async () => {
      const { sendHiddenMessage, roomUuid, roomMessages } = setup({
        messages: [contactMessage('Sala A', 'a-1')],
      });
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
      expect(sendHiddenMessage.mock.calls[0][0]).toContain('Sala A');
      vi.clearAllMocks();

      roomUuid.value = 'room-2';
      await flush();

      expect(copilotSocketManager.setRoomContext).not.toHaveBeenCalled();
      expect(sendHiddenMessage).not.toHaveBeenCalled();
      expect(markProcessed).not.toHaveBeenCalled();

      roomMessages.value = [
        contactMessage('Sala B', 'b-1', '2024-01-01T00:00:00Z', 'room-2'),
      ];
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
      expect(sendHiddenMessage.mock.calls[0][0]).toContain('Sala B');
      expect(sendHiddenMessage.mock.calls[0][0]).not.toContain('Sala A');
      expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
        'room-2',
        connectionValue,
        'Contact: Sala B',
      );
    });

    it('does not fire without a complete storage scope', async () => {
      const { sendHiddenMessage } = setup({
        messages: [contactMessage('Oi')],
        storageScope: {
          projectUuid: 'project-1',
          agentEmail: 'agent@example.com',
          channelUuid: '',
        },
      });
      await flush();
      vi.advanceTimersByTime(15000);
      await flush();

      expect(sendHiddenMessage).not.toHaveBeenCalled();
      expect(markProcessed).not.toHaveBeenCalled();
    });

    it('does not reprocess a uuid already in processedUuids even if createdOn is newer', async () => {
      processedByRoom['room-1'] = {
        messageUuid: 'msg-old',
        createdOn: '2024-01-01T00:00:00Z',
        processedAt: 1,
        processedUuids: ['msg-old'],
      };

      const { sendHiddenMessage } = setup({
        messages: [
          contactMessage('já vista', 'msg-old', '2024-01-01T00:02:00Z'),
          contactMessage('nova', 'msg-new', '2024-01-01T00:03:00Z'),
        ],
      });
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
      expect(sendHiddenMessage.mock.calls[0][0]).toContain('Contact: nova');
      expect(sendHiddenMessage.mock.calls[0][0]).not.toContain('já vista');
    });

    it('does not mark the previous room as processed if the room changes during send', async () => {
      let resolveSend: (() => void) | undefined;
      const sendHiddenMessage = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSend = resolve;
          }),
      );
      const { roomUuid } = setup({
        messages: [contactMessage('Sala A', 'a-1')],
        sendHiddenMessage,
      });
      await flush();

      expect(sendHiddenMessage).toHaveBeenCalledTimes(1);
      expect(markProcessed).not.toHaveBeenCalled();

      roomUuid.value = 'room-2';
      resolveSend?.();
      await flush();

      expect(markProcessed).not.toHaveBeenCalled();
    });
  });
});
