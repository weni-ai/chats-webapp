import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { useCopilotHistory } from '../useCopilotHistory';
import CopilotHistory from '@/services/api/resources/chats/copilotHistory';

vi.mock('@/services/api/resources/chats/copilotHistory', () => ({
  default: {
    getMessages: vi.fn(),
  },
}));

describe('useCopilotHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads and reverses messages when roomUuid is set', async () => {
    CopilotHistory.getMessages.mockResolvedValue({
      next: null,
      previous: null,
      results: [
        {
          id: 2,
          contact: null,
          urn: 'room-1',
          channel: null,
          direction: 'out',
          text: 'Second',
          created_on: '2024-01-01T12:01:00Z',
        },
        {
          id: 1,
          contact: null,
          urn: 'room-1',
          channel: null,
          direction: 'in',
          text: 'First',
          created_on: '2024-01-01T12:00:00Z',
        },
      ],
    });

    const roomUuid = ref<string | undefined>('room-1');
    const { messages, isLoading } = useCopilotHistory(roomUuid);

    await vi.waitFor(() => expect(isLoading.value).toBe(false));

    expect(CopilotHistory.getMessages).toHaveBeenCalledWith({
      roomUuid: 'room-1',
      cursor: undefined,
    });
    expect(messages.value.map((message) => message.text)).toEqual([
      'First',
      'Second',
    ]);
  });

  it('clears messages when roomUuid is missing', async () => {
    const roomUuid = ref<string | undefined>(undefined);
    const { messages } = useCopilotHistory(roomUuid);
    await nextTick();

    expect(CopilotHistory.getMessages).not.toHaveBeenCalled();
    expect(messages.value).toEqual([]);
  });

  it('loads the next page prepended in chronological order', async () => {
    CopilotHistory.getMessages
      .mockResolvedValueOnce({
        next: 'https://api.example/messages?cursor=page-2',
        previous: null,
        results: [
          {
            id: 3,
            contact: null,
            urn: 'room-1',
            channel: null,
            direction: 'out',
            text: 'Newer',
            created_on: '2024-01-01T12:02:00Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            contact: null,
            urn: 'room-1',
            channel: null,
            direction: 'in',
            text: 'Older',
            created_on: '2024-01-01T12:00:00Z',
          },
        ],
      });

    const roomUuid = ref<string | undefined>('room-1');
    const { messages, isLoading, hasMore, loadMore } =
      useCopilotHistory(roomUuid);

    await vi.waitFor(() => expect(isLoading.value).toBe(false));
    expect(hasMore.value).toBe(true);

    await loadMore();
    await vi.waitFor(() => expect(isLoading.value).toBe(false));

    expect(CopilotHistory.getMessages).toHaveBeenLastCalledWith({
      roomUuid: 'room-1',
      cursor: 'page-2',
    });
    expect(messages.value.map((message) => message.text)).toEqual([
      'Older',
      'Newer',
    ]);
    expect(hasMore.value).toBe(false);
  });
});
