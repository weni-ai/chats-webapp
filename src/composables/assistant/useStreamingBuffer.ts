import { onBeforeUnmount, ref, watch, type Ref } from 'vue';

const WORD_REVEAL_BASE_MS = 70;
const WORD_REVEAL_JITTER_MS = 20;

function nextDelay() {
  return WORD_REVEAL_BASE_MS + (Math.random() * 2 - 1) * WORD_REVEAL_JITTER_MS;
}

function countWords(text: string) {
  return (text.match(/\S+/g) || []).length;
}

function getWordsUpTo(text: string, wordCount: number) {
  const tokens = text.match(/\S+\s*/g) || [];
  return tokens.slice(0, wordCount).join('');
}

export function useStreamingBuffer(
  text: Ref<string>,
  isStreaming: Ref<boolean>,
  onWordRevealed?: () => void,
) {
  const displayedText = ref(isStreaming.value ? '' : text.value || '');
  const isBuffering = ref(isStreaming.value);

  const targetTextRef = { current: text.value || '' };
  const isStreamingRef = { current: isStreaming.value };
  const revealedWordCountRef = { current: 0 };
  const bufferingStartedRef = { current: isStreaming.value };

  let revealTimer: ReturnType<typeof setTimeout> | null = null;

  function clearRevealTimer() {
    if (!revealTimer) {
      return;
    }

    clearTimeout(revealTimer);
    revealTimer = null;
  }

  function scheduleNext() {
    clearRevealTimer();

    revealTimer = setTimeout(() => {
      const target = targetTextRef.current;
      const totalWords = countWords(target);

      if (revealedWordCountRef.current < totalWords) {
        revealedWordCountRef.current += 1;
        displayedText.value = getWordsUpTo(
          target,
          revealedWordCountRef.current,
        );
        onWordRevealed?.();
        scheduleNext();
        return;
      }

      if (!isStreamingRef.current) {
        displayedText.value = target;
        isBuffering.value = false;
        bufferingStartedRef.current = false;
        return;
      }

      scheduleNext();
    }, nextDelay());
  }

  watch(
    text,
    (value) => {
      targetTextRef.current = value || '';
    },
    { immediate: true },
  );

  watch(
    isStreaming,
    (streaming) => {
      isStreamingRef.current = streaming;

      if (streaming && !bufferingStartedRef.current) {
        bufferingStartedRef.current = true;
        revealedWordCountRef.current = 0;
        displayedText.value = '';
        isBuffering.value = true;
      }

      if (!streaming && !isBuffering.value) {
        displayedText.value = text.value || '';
      }
    },
    { immediate: true },
  );

  watch(
    isBuffering,
    (buffering) => {
      if (!buffering) {
        clearRevealTimer();
        return;
      }

      scheduleNext();
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    clearRevealTimer();
  });

  return {
    displayedText,
    isBuffering,
  };
}
