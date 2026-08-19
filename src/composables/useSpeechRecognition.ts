import {
  computed,
  onUnmounted,
  ref,
  unref,
  watch,
  type ComputedRef,
  type MaybeRef,
  type Ref,
} from 'vue';

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
  processLocally?: boolean;
  onend: ((_ev: Event) => void) | null;
  onerror: ((_ev: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((_ev: SpeechRecognitionEventLike) => void) | null;
  onstart: ((_ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

type SpeechRecognitionAvailability =
  | 'available'
  | 'downloadable'
  | 'downloading'
  | 'unavailable';

type SpeechRecognitionInstallOptions = {
  langs: string[];
  processLocally?: boolean;
  quality?: 'command' | 'dictation' | 'conversation';
};

type SpeechRecognitionConstructor = (new () => SpeechRecognitionLike) & {
  available?: (
    _options: SpeechRecognitionInstallOptions,
  ) => Promise<SpeechRecognitionAvailability>;
  install?: (_options: SpeechRecognitionInstallOptions) => Promise<boolean>;
};

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

const SPEECH_LANG_BY_LOCALE: Record<string, string> = {
  en: 'en-US',
  'en-us': 'en-US',
  es: 'es-ES',
  'pt-br': 'pt-BR',
  ro: 'ro-RO',
};

const DEFAULT_SPEECH_LANG = 'en-US';

const LANG_FALLBACKS: Record<string, string[]> = {
  en: ['en-US', 'en-GB', 'en'],
  'en-US': ['en-US', 'en-GB', 'en'],
  'en-GB': ['en-US', 'en'],
  'es-ES': ['es-ES', 'es'],
  'pt-BR': ['pt-BR', 'pt'],
  'ro-RO': ['ro-RO', 'ro'],
};

const PLATFORM_SPEECH_LANGS = ['pt-BR', 'en-US', 'es-ES', 'ro-RO'] as const;

const logDictation = (message: string, extra?: unknown) => {
  if (extra !== undefined) {
    console.info(`[dictation] ${message}`, extra);
    return;
  }

  console.info(`[dictation] ${message}`);
};

export function toSpeechRecognitionLang(locale?: string): string {
  const normalized = (locale || 'en').toLowerCase().replace('_', '-');
  return SPEECH_LANG_BY_LOCALE[normalized] || DEFAULT_SPEECH_LANG;
}

export interface UseSpeechRecognitionOptions {
  lang?: MaybeRef<string>;
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

  // Prefer the prefixed constructor: it is the classic cloud recognizer.
  // window.SpeechRecognition on newer Chrome is the on-device API, whose
  // language packs are often unavailable (Linux, WSL, many locales).
  return webkitSpeechRecognition || SpeechRecognition || undefined;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!getSpeechRecognitionAPI();
}

function getLanguagePackAPI(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;

  const { SpeechRecognition, webkitSpeechRecognition } =
    window as WindowWithSpeechRecognition;

  if (typeof SpeechRecognition?.available === 'function') {
    return SpeechRecognition;
  }

  if (typeof webkitSpeechRecognition?.available === 'function') {
    return webkitSpeechRecognition;
  }

  return undefined;
}

export async function listSpeechRecognitionLangPacks() {
  const SpeechRecognitionAPI = getLanguagePackAPI();

  if (!SpeechRecognitionAPI) {
    logDictation(
      'SpeechRecognition.available() is not supported — language packs cannot be queried',
    );
    return [];
  }

  const rows = [];

  for (const lang of PLATFORM_SPEECH_LANGS) {
    try {
      const onDevice = await SpeechRecognitionAPI.available({
        langs: [lang],
        processLocally: true,
        quality: 'dictation',
      });
      const cloudOrLocal = await SpeechRecognitionAPI.available({
        langs: [lang],
        processLocally: false,
        quality: 'dictation',
      });

      rows.push({ lang, onDevice, cloudOrLocal });
    } catch (error) {
      rows.push({
        lang,
        onDevice: 'error',
        cloudOrLocal: 'error',
        error,
      });
    }
  }

  logDictation(
    'language pack status (onDevice = local pack, cloudOrLocal = cloud or local)',
  );
  console.table(rows);

  return rows;
}

/**
 * Continuous speech recognition via the native Web Speech API.
 * Accumulates final transcripts so pauses do not clear or duplicate text.
 *
 * On-device language packs are often unavailable. start() therefore uses the
 * cloud recognizer immediately so the call stays inside the user gesture.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const { continuous = true, interimResults = true, lang } = options;

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
  let langFallbackIndex = 0;

  const getPreferredLang = () => unref(lang) || DEFAULT_SPEECH_LANG;

  const getLangFallbacks = (): string[] => {
    const preferred = getPreferredLang();

    if (LANG_FALLBACKS[preferred]) {
      return LANG_FALLBACKS[preferred];
    }

    const base = preferred.split('-')[0];
    const fallbacks = [preferred];

    if (base && base.toLowerCase() !== preferred.toLowerCase()) {
      fallbacks.push(base);
    }

    return fallbacks;
  };

  const applyRecognitionLang = (instance: SpeechRecognitionLike) => {
    const fallbacks = getLangFallbacks();
    const current =
      fallbacks[Math.min(langFallbackIndex, fallbacks.length - 1)];

    if (current) {
      instance.lang = current;
    }

    logDictation('starting recognition', {
      lang: current || '(browser default)',
      fallbackIndex: langFallbackIndex,
    });
  };

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
    // Chrome rejects some regional tags (e.g. es-ES) with language-not-supported.
    // Advance to the next fallback and let onend restart recognition.
    if (
      event.error === 'language-not-supported' &&
      langFallbackIndex < getLangFallbacks().length - 1
    ) {
      langFallbackIndex += 1;
      logDictation('language-not-supported, trying fallback', {
        nextLang: getLangFallbacks()[langFallbackIndex] || '(browser default)',
      });
      return;
    }

    logDictation('recognition error', {
      error: event.error,
      message: event.message,
    });

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
    applyRecognitionLang(instance);

    instance.onresult = handleResult;
    instance.onerror = handleError;
    instance.onend = handleEnd;
    instance.onstart = () => {
      isListening.value = true;
      error.value = null;
    };

    return instance;
  };

  const beginRecognition = () => {
    if (!shouldKeepListening) return;

    recognition = createRecognition();

    try {
      recognition?.start();
    } catch {
      shouldKeepListening = false;
      isListening.value = false;
      error.value = 'start-failed';
    }
  };

  const start = () => {
    if (!SpeechRecognitionAPI || shouldKeepListening) return;

    reset();
    clearRestartTimeout();
    langFallbackIndex = 0;
    shouldKeepListening = true;

    logDictation('start requested', {
      constructor: SpeechRecognitionAPI.name,
      lang: getPreferredLang(),
    });

    beginRecognition();
  };

  watch(
    () => unref(lang),
    (nextLang, previousLang) => {
      if (!shouldKeepListening || nextLang === previousLang) return;

      langFallbackIndex = 0;
      logDictation('locale changed, restarting recognition', {
        from: previousLang,
        to: nextLang,
      });

      try {
        recognition?.stop();
      } catch {
        scheduleRestart();
      }
    },
    { flush: 'sync' },
  );

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

if (typeof window !== 'undefined') {
  (
    window as Window & {
      listSpeechRecognitionLangPacks?: typeof listSpeechRecognitionLangPacks;
    }
  ).listSpeechRecognitionLangPacks = listSpeechRecognitionLangPacks;
}
