import { ref, watch, type Ref } from 'vue';

import CopilotHistory from '@/services/api/resources/chats/copilotHistory';
import { mapHistoryMessage } from '@/services/assistant/historyMessageMapper';
import type { AssistantMessage } from '@/services/assistant/types';

type RoomUuidRef = Ref<string | undefined>;

function extractCursor(nextUrl: string | null): string | undefined {
  if (!nextUrl) {
    return undefined;
  }

  try {
    const url = new URL(nextUrl, 'https://placeholder.local');
    return url.searchParams.get('cursor') || undefined;
  } catch {
    return undefined;
  }
}

export function useCopilotHistory(roomUuid: RoomUuidRef) {
  const messages = ref<AssistantMessage[]>([]);
  const isLoading = ref(false);
  const hasMore = ref(false);
  const error = ref<unknown>(null);

  let nextCursor: string | undefined;
  let requestId = 0;

  async function fetchPage(cursor?: string, append = false) {
    const currentRoomUuid = roomUuid.value;
    if (!currentRoomUuid) {
      messages.value = [];
      hasMore.value = false;
      nextCursor = undefined;
      return;
    }

    const currentRequestId = ++requestId;
    isLoading.value = true;
    error.value = null;

    try {
      const response = await CopilotHistory.getMessages({
        roomUuid: currentRoomUuid,
        cursor,
      });

      if (currentRequestId !== requestId) {
        return;
      }

      const mapped = response.results.map(mapHistoryMessage);
      // API returns newest-first (-created_on); UI expects chronological order.
      const chronological = [...mapped].reverse();

      messages.value = append
        ? [...chronological, ...messages.value]
        : chronological;

      nextCursor = extractCursor(response.next);
      hasMore.value = !!nextCursor;
    } catch (err) {
      if (currentRequestId !== requestId) {
        return;
      }

      error.value = err;
      if (!append) {
        messages.value = [];
        hasMore.value = false;
        nextCursor = undefined;
      }
    } finally {
      if (currentRequestId === requestId) {
        isLoading.value = false;
      }
    }
  }

  async function loadMore() {
    if (!hasMore.value || isLoading.value || !nextCursor) {
      return;
    }

    await fetchPage(nextCursor, true);
  }

  function reload() {
    nextCursor = undefined;
    return fetchPage();
  }

  watch(
    roomUuid,
    () => {
      nextCursor = undefined;
      messages.value = [];
      fetchPage();
    },
    { immediate: true },
  );

  return {
    messages,
    isLoading,
    hasMore,
    error,
    loadMore,
    reload,
  };
}
