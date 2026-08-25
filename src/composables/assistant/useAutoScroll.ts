import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';

export const BOTTOM_SCROLL_THRESHOLD_PX = 100;

type ScrollBehaviorOption = 'auto' | 'smooth';

export function useAutoScroll(
  messages: Ref<unknown>,
  isThinking: Ref<boolean>,
  isTyping: Ref<boolean> = ref(false),
) {
  const listRef = ref<HTMLElement | null>(null);
  const bottomAnchorRef = ref<HTMLElement | null>(null);
  const showGoToBottom = ref(false);
  const isNearBottomRef = { current: true };

  function scrollToBottom(behavior: ScrollBehaviorOption = 'smooth') {
    bottomAnchorRef.value?.scrollIntoView?.({ behavior });
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
    syncScrollState();
  }

  watch(
    [messages, isThinking, isTyping],
    () => {
      nextTick(() => {
        scrollToBottom();
        requestAnimationFrame(syncScrollState);
      });
    },
    { deep: true, immediate: true },
  );

  onMounted(() => {
    const el = listRef.value;

    if (!el) {
      return;
    }

    syncScrollState();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', syncScrollState);
  });

  onBeforeUnmount(() => {
    listRef.value?.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', syncScrollState);
  });

  return {
    listRef,
    bottomAnchorRef,
    showGoToBottom,
    scrollToBottom,
  };
}
