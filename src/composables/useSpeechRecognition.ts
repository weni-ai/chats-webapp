import { computed, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';

/**
 * Minimal Web Speech API typings.
 * TypeScript's DOM lib does not include SpeechRecognition on Window —
 * the interface was dropped from lib.dom because it is not in a stable W3C
 * standard, but Chrome still exposes it as webkitSpeechRecognition.
 */
interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: {
      readonly isFinal: boolean;
      readonly length: number;
      [index: number]: {
        readonly transcript: string;
        readonly confidence: number;
      };
    };
  };
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: ((_ev: Event) => void) | null;
  onerror: ((_ev: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((_ev: SpeechRecognitionEventLike) => void) | null;
  onstart: ((_ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

/** Errors that should stop listening instead of auto-restarting */
const FATAL_SPEECH_ERRORS = new Set([
  'audio-capture',
  'language-not-supported',
  'not-allowed',
  'service-not-allowed',
]);

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface UseSpeechRecognitionReturn {
  isSupported: ComputedRef<boolean>;
  isListening: Ref<boolean>;
  result: ComputedRef<string>;
  error: Ref<string | null>;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

function getSpeechRecognitionAPI(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;

  const { SpeechRecognition, webkitSpeechRecognition } =
    window as WindowWithSpeechRecognition;

  return webkitSpeechRecognition || SpeechRecognition || undefined;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!getSpeechRecognitionAPI();
}

/**
 * Continuous speech recognition via the native Web Speech API.
 * Accumulates final transcripts so pauses do not clear or duplicate text.
 *
 * Note: Chrome uses Google's cloud speech service — no local language pack
 * download is required. Edge/Windows on-device recognition may differ.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const { continuous = true, interimResults = true } = options;

  const SpeechRecognitionAPI = getSpeechRecognitionAPI();

  const isSupported = computed(() => isSpeechRecognitionSupported());
  const isListening = ref(false);
  const error = ref<string | null>(null);
  const finalTranscript = ref('');
  const interimTranscript = ref('');

  const result = computed(
    () => `${finalTranscript.value}${interimTranscript.value}`,
  );

  let recognition: SpeechRecognitionLike | null = null;
  let shouldKeepListening = false;
  let restartTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const clearRestartTimeout = () => {
    if (restartTimeoutId !== null) {
      clearTimeout(restartTimeoutId);
      restartTimeoutId = null;
    }
  };

  const reset = () => {
    finalTranscript.value = '';
    interimTranscript.value = '';
    error.value = null;
  };

  const appendFinalTranscript = (transcript: string) => {
    if (!transcript) return;

    const needsSpace =
      !!finalTranscript.value &&
      !finalTranscript.value.endsWith(' ') &&
      !transcript.startsWith(' ');

    finalTranscript.value += needsSpace ? ` ${transcript}` : transcript;
  };

  const handleResult = (event: SpeechRecognitionEventLike) => {
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const alternative = event.results[i][0];
      if (!alternative) continue;

      const { transcript } = alternative;

      if (event.results[i].isFinal) {
        appendFinalTranscript(transcript);
      } else {
        interim += transcript;
      }
    }

    interimTranscript.value = interim;
  };

  const handleError = (event: SpeechRecognitionErrorEventLike) => {
    // Chrome often fires transient errors (network, no-speech) in continuous
    // mode. Let onend restart unless the error is fatal.
    if (!FATAL_SPEECH_ERRORS.has(event.error)) {
      return;
    }

    error.value = event.error;
    shouldKeepListening = false;
    clearRestartTimeout();
    isListening.value = false;
  };

  const scheduleRestart = () => {
    clearRestartTimeout();

    // Chrome throws InvalidStateError if start() runs synchronously inside onend
    restartTimeoutId = setTimeout(() => {
      restartTimeoutId = null;

      if (!shouldKeepListening) {
        isListening.value = false;
        return;
      }

      try {
        recognition = createRecognition();
        recognition?.start();
      } catch {
        shouldKeepListening = false;
        isListening.value = false;
        error.value = 'start-failed';
      }
    }, 150);
  };

  const handleEnd = () => {
    if (shouldKeepListening) {
      scheduleRestart();
      return;
    }

    isListening.value = false;
  };

  const createRecognition = (): SpeechRecognitionLike | null => {
    if (!SpeechRecognitionAPI) return null;

    const instance = new SpeechRecognitionAPI();

    instance.continuous = continuous;
    instance.interimResults = interimResults;

    instance.onresult = handleResult;
    instance.onerror = handleError;
    instance.onend = handleEnd;
    instance.onstart = () => {
      isListening.value = true;
      error.value = null;
    };

    return instance;
  };

  const start = () => {
    if (!SpeechRecognitionAPI || shouldKeepListening) return;

    reset();
    clearRestartTimeout();
    shouldKeepListening = true;
    recognition = createRecognition();

    try {
      recognition?.start();
    } catch {
      shouldKeepListening = false;
      isListening.value = false;
      error.value = 'start-failed';
    }
  };

  const stop = () => {
    shouldKeepListening = false;
    clearRestartTimeout();

    if (interimTranscript.value) {
      appendFinalTranscript(interimTranscript.value);
      interimTranscript.value = '';
    }

    try {
      recognition?.stop();
    } catch {
      // Already stopped
    }

    isListening.value = false;
  };

  onUnmounted(() => {
    stop();
    recognition = null;
  });

  return {
    isSupported,
    isListening,
    result,
    error,
    start,
    stop,
    reset,
  };
}
