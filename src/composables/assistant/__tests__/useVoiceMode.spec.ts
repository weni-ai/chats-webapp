import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useVoiceMode } from '../useVoiceMode';

const listeners = new Map();
const voiceServiceMock = {
  init: vi.fn(async () => undefined),
  on: vi.fn((event, cb) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(cb);
  }),
  setMessageCallback: vi.fn(),
  startSession: vi.fn(async () => undefined),
  endSession: vi.fn(),
  processTextChunk: vi.fn(),
  removeAllListeners: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('@/services/voice', () => ({
  VoiceService: Object.assign(
    vi.fn(function VoiceService() {
      return voiceServiceMock;
    }),
    {
      isSupported: () => true,
    },
  ),
}));

function emit(event, payload) {
  listeners.get(event)?.forEach((cb) => cb(payload));
}

describe('useVoiceMode', () => {
  beforeEach(() => {
    listeners.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    listeners.clear();
  });

  it('enters voice mode and wires the message callback', async () => {
    const sendMessage = vi.fn();
    const requestVoiceTokens = vi.fn(async () => ({
      sttToken: 'stt',
      ttsToken: 'tts',
    }));
    const {
      canEnterVoiceMode,
      enter,
      isVoiceModeActive,
      voicePartialTranscript,
    } = useVoiceMode({
      isVoiceEnabledByServer: ref(true),
      messages: ref([]),
      sendMessage,
      requestVoiceTokens,
    });

    expect(canEnterVoiceMode.value).toBe(true);

    const entered = await enter();
    expect(entered).toBe(true);
    expect(voiceServiceMock.init).toHaveBeenCalled();
    expect(voiceServiceMock.startSession).toHaveBeenCalled();
    expect(voiceServiceMock.setMessageCallback).toHaveBeenCalled();

    const messageCallback =
      voiceServiceMock.setMessageCallback.mock.calls[0][0];
    messageCallback('hello from voice');
    expect(sendMessage).toHaveBeenCalledWith('hello from voice');

    emit('session:started');
    expect(isVoiceModeActive.value).toBe(true);

    emit('transcript:partial', { text: 'partial' });
    expect(voicePartialTranscript.value).toBe('partial');
  });

  it('forwards streaming AI text chunks to the voice service', async () => {
    const messages = ref([]);
    const { enter } = useVoiceMode({
      isVoiceEnabledByServer: ref(true),
      messages,
      sendMessage: vi.fn(),
      requestVoiceTokens: vi.fn(async () => ({
        sttToken: 'stt',
        ttsToken: 'tts',
      })),
    });

    await enter();
    emit('session:started');

    messages.value = [
      {
        id: 'ai-1',
        direction: 'ai',
        type: 'text',
        text: 'Hello',
        quickReplies: [],
        status: 'streaming',
        timestamp: 1,
      },
    ];
    await nextTick();

    expect(voiceServiceMock.processTextChunk).toHaveBeenCalledWith(
      'Hello',
      false,
    );
  });
});
