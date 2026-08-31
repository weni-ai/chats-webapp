import {
  computed,
  getCurrentInstance,
  onUnmounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import type { AssistantMessage } from '@/services/assistant/types';
import { VoiceService } from '@/services/voice';

type VoiceErrorLike = {
  code?: string;
  message?: string;
  suggestion?: string;
  recoverable?: boolean;
} | null;

type UseVoiceModeOptions = {
  isVoiceEnabledByServer: Ref<boolean>;
  messages: Ref<AssistantMessage[]>;
  sendMessage: (_text: string) => void;
  requestVoiceTokens: (_timeout?: number) => Promise<{
    sttToken: string;
    ttsToken: string;
  }>;
};

export function useVoiceMode({
  isVoiceEnabledByServer,
  messages,
  sendMessage,
  requestVoiceTokens,
}: UseVoiceModeOptions) {
  const isVoiceModeSupported = ref(VoiceService.isSupported());
  const isVoiceModeActive = ref(false);
  const isEnteringVoiceMode = ref(false);
  const isVoiceModePageActive = ref(false);
  const voiceModeState = ref<string | null>(null);
  const voicePartialTranscript = ref('');
  const voiceError = ref<VoiceErrorLike>(null);

  let voiceService: InstanceType<typeof VoiceService> | null = null;
  let processedText = '';
  let lastProcessedMessageId: string | null = null;

  const isEnabled = computed(() => !!isVoiceEnabledByServer.value);
  const canEnterVoiceMode = computed(
    () => isEnabled.value && isVoiceModeSupported.value,
  );
  const isListening = computed(
    () =>
      voiceModeState.value === 'listening' ||
      voiceModeState.value === 'processing',
  );
  const isSpeaking = computed(() => voiceModeState.value === 'speaking');

  function cleanupVoiceService() {
    if (!voiceService) {
      return;
    }

    voiceService.removeAllListeners?.();
    voiceService.destroy?.();
    voiceService = null;
  }

  function resetVoiceUiState() {
    isEnteringVoiceMode.value = false;
    isVoiceModeActive.value = false;
    voiceModeState.value = null;
    voicePartialTranscript.value = '';
    processedText = '';
    lastProcessedMessageId = null;
  }

  async function enter() {
    if (!canEnterVoiceMode.value) {
      return false;
    }

    cleanupVoiceService();
    processedText = '';
    lastProcessedMessageId = null;
    voiceError.value = null;
    isEnteringVoiceMode.value = true;
    isVoiceModePageActive.value = true;

    const vs = new VoiceService();
    await vs.init({
      getTokens: () => requestVoiceTokens(),
    });

    vs.on('state:changed', ({ state }: { state: string }) => {
      voiceModeState.value = state;
    });
    vs.on('transcript:partial', ({ text }: { text: string }) => {
      voicePartialTranscript.value = text || '';
    });
    vs.on('transcript:committed', () => {
      voicePartialTranscript.value = '';
    });
    vs.on('session:started', () => {
      isEnteringVoiceMode.value = false;
      isVoiceModeActive.value = true;
    });
    vs.on('session:ended', ({ reason }: { reason?: string } = {}) => {
      resetVoiceUiState();
      if (reason === 'user') {
        voiceError.value = null;
      }
      if (voiceService === vs) {
        cleanupVoiceService();
      }
      isVoiceModePageActive.value = false;
    });
    vs.on('error', (error: VoiceErrorLike) => {
      isEnteringVoiceMode.value = false;
      voiceError.value = error;
    });
    vs.setMessageCallback((text: string) => sendMessage(text));
    voiceService = vs;

    try {
      await vs.startSession();
      return true;
    } catch {
      return false;
    }
  }

  function exit() {
    if (voiceService) {
      voiceService.endSession();
      return;
    }

    resetVoiceUiState();
    isVoiceModePageActive.value = false;
  }

  async function retry() {
    exit();
    voiceError.value = null;
    return enter();
  }

  function dismissError() {
    voiceError.value = null;
    isVoiceModePageActive.value = false;
    resetVoiceUiState();
  }

  watch(
    messages,
    (currentMessages) => {
      if (!isVoiceModeActive.value || !voiceService) {
        return;
      }

      const lastAiMessage = [...currentMessages]
        .reverse()
        .find(
          (message) => message.direction === 'ai' && message.type === 'text',
        );

      if (!lastAiMessage) {
        return;
      }

      const fullText = lastAiMessage.suggestion || lastAiMessage.text || '';
      if (!fullText) {
        return;
      }

      if (lastProcessedMessageId !== lastAiMessage.id) {
        lastProcessedMessageId = lastAiMessage.id;
        processedText = '';
      }

      if (!fullText.startsWith(processedText)) {
        processedText = '';
      }

      const newText = fullText.slice(processedText.length);
      if (!newText) {
        return;
      }

      const isStreaming = lastAiMessage.status === 'streaming';
      voiceService.processTextChunk(newText, !isStreaming);
      processedText = fullText;
    },
    { deep: true },
  );

  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (voiceService) {
        voiceService.endSession?.();
        cleanupVoiceService();
      }
    });
  }

  return {
    isVoiceModeSupported,
    isEnabled,
    canEnterVoiceMode,
    isVoiceModeActive,
    isEnteringVoiceMode,
    isVoiceModePageActive,
    voiceModeState,
    voicePartialTranscript,
    voiceError,
    isListening,
    isSpeaking,
    enter,
    exit,
    retry,
    dismissError,
  };
}
