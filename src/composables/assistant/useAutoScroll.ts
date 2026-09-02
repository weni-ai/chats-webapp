import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';

export const BOTTOM_SCROLL_THRESHOLD_PX = 100;

export function useAutoScroll(
  messages: Ref<unknown>,
  isThinking: Ref<boolean>,
  isTyping: Ref<boolean> = ref(false),
) {
  const listRef = ref<HTMLElement | null>(null);
  const bottomAnchorRef = ref<HTMLElement | null>(null);
  const showGoToBottom = ref(false);
  const isNearBottomRef = { current: true };
  const isProgrammaticScrollRef = { current: false };

  function scrollToBottom() {
    const el = listRef.value;

    if (!el) {
      return;
    }

    isProgrammaticScrollRef.current = true;
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => {
      syncScrollState();
      isProgrammaticScrollRef.current = false;
    });
  }

  function scrollToBottomIfNear() {
    if (!isNearBottomRef.current) {
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
  }

  function handleWheel(event: WheelEvent) {
    // Treat upward wheel intent as leaving the bottom immediately so auto-scroll
    // does not fight the user mid-gesture (especially with smooth ancestors).
    if (event.deltaY < 0) {
      isNearBottomRef.current = false;
      showGoToBottom.value = true;
    }
  }

  watch(
    [messages, isThinking, isTyping],
    () => {
      nextTick(() => {
        scrollToBottomIfNear();
      });
    },
    { deep: true },
  );

  onMounted(() => {
    const el = listRef.value;

    if (!el) {
      return;
    }

    syncScrollState();
    el.addEventListener('scroll', handleScroll, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('resize', syncScrollState);
  });

  onBeforeUnmount(() => {
    listRef.value?.removeEventListener('scroll', handleScroll);
    listRef.value?.removeEventListener('wheel', handleWheel);
    window.removeEventListener('resize', syncScrollState);
  });

  return {
    listRef,
    bottomAnchorRef,
    showGoToBottom,
    scrollToBottom,
    scrollToBottomIfNear,
  };
}
