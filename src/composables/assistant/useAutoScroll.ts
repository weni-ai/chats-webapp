import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';

export const BOTTOM_SCROLL_THRESHOLD_PX = 100;
const LAYOUT_PIN_MS = 1000;

export function useAutoScroll(
  messages: Ref<unknown>,
  isThinking: Ref<boolean>,
  isTyping: Ref<boolean> = ref(false),
  isLoadingHistory: Ref<boolean> = ref(false),
) {
  const listRef = ref<HTMLElement | null>(null);
  const bottomAnchorRef = ref<HTMLElement | null>(null);
  const showGoToBottom = ref(false);
  const isNearBottomRef = { current: true };
  const isProgrammaticScrollRef = { current: false };
  let pinUntil = 0;
  let resizeObserver: ResizeObserver | null = null;

  function isPinnedToBottom() {
    return isNearBottomRef.current || Date.now() < pinUntil;
  }

  function scrollToBottom() {
    const el = listRef.value;

    if (!el) {
      return;
    }

    isProgrammaticScrollRef.current = true;
    isNearBottomRef.current = true;
    showGoToBottom.value = false;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      syncScrollState();
      isProgrammaticScrollRef.current = false;
    });
  }

  function pinToBottom() {
    pinUntil = Date.now() + LAYOUT_PIN_MS;
    isNearBottomRef.current = true;
    nextTick(() => {
      scrollToBottom();
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    });
  }

  function scrollToBottomIfNear() {
    if (!isPinnedToBottom()) {
      return;
    }

    scrollToBottom();
  }

  function syncScrollState() {
    const el = listRef.value;

    if (!el) {
      return;
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNear = distanceFromBottom <= BOTTOM_SCROLL_THRESHOLD_PX;

    isNearBottomRef.current = isNear;
    showGoToBottom.value = !isNear;
  }

  function handleScroll() {
    if (isProgrammaticScrollRef.current) {
      return;
    }

    syncScrollState();

    if (!isNearBottomRef.current) {
      pinUntil = 0;
    }
  }

  function handleWheel(event: WheelEvent) {
    // Treat upward wheel intent as leaving the bottom immediately so auto-scroll
    // does not fight the user mid-gesture (especially with smooth ancestors).
    if (event.deltaY < 0) {
      pinUntil = 0;
      isNearBottomRef.current = false;
      showGoToBottom.value = true;
    }
  }

  watch(
    [messages, isThinking, isTyping, isLoadingHistory],
    () => {
      if (isLoadingHistory.value) {
        isNearBottomRef.current = true;
        pinUntil = Date.now() + LAYOUT_PIN_MS;
        nextTick(() => {
          scrollToBottom();
        });
        return;
      }

      nextTick(() => {
        scrollToBottomIfNear();
      });
    },
    { deep: true },
  );

  watch(isLoadingHistory, (isLoading, wasLoading) => {
    if (wasLoading && !isLoading) {
      pinToBottom();
    }
  });

  onMounted(() => {
    const el = listRef.value;

    if (!el) {
      return;
    }

    pinToBottom();
    el.addEventListener('scroll', handleScroll, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('resize', syncScrollState);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (isPinnedToBottom()) {
          scrollToBottom();
        }
      });
      resizeObserver.observe(el);
    }
  });

  onBeforeUnmount(() => {
    listRef.value?.removeEventListener('scroll', handleScroll);
    listRef.value?.removeEventListener('wheel', handleWheel);
    window.removeEventListener('resize', syncScrollState);
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  return {
    listRef,
    bottomAnchorRef,
    showGoToBottom,
    scrollToBottom,
    scrollToBottomIfNear,
  };
}
