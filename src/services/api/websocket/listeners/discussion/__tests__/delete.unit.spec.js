import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useRooms } from '@/store/modules/chats/rooms';

import wsDiscussionDelete from '@/services/api/websocket/listeners/discussion/delete';

vi.mock('@/store/modules/chats/discussions');
vi.mock('@/store/modules/chats/rooms');

describe('Discussion delete', () => {
  let mockDiscussionStore;
  let mockRoomsStore;
  let mockApp;

  beforeEach(() => {
    mockDiscussionStore = {
      discussions: [],
      discussionsCount: 0,
      removeDiscussion: vi.fn(),
      setActiveDiscussion: vi.fn(),
    };

    useDiscussions.mockReturnValue(mockDiscussionStore);

    mockRoomsStore = {
      setActiveRoom: vi.fn(),
    };

    useRooms.mockReturnValue(mockRoomsStore);

    mockApp = {
      $route: {
        params: {
          discussionId: '123',
        },
      },
    };
  });

  it('removes a discussion that is not active', () => {
    mockDiscussionStore.discussions = [{ uuid: '456' }];
    const discussion = { uuid: '456' };

    wsDiscussionDelete(discussion, { app: mockApp });

    expect(mockDiscussionStore.removeDiscussion).toHaveBeenCalledWith('456');
    expect(mockDiscussionStore.setActiveDiscussion).not.toHaveBeenCalled();
    expect(mockRoomsStore.setActiveRoom).not.toHaveBeenCalled();
  });

  it('removes the active discussion and resets active states', () => {
    mockDiscussionStore.discussions = [{ uuid: '123' }];
    const discussion = { uuid: '123' };

    wsDiscussionDelete(discussion, { app: mockApp });

    expect(mockDiscussionStore.removeDiscussion).toHaveBeenCalledWith('123');
    expect(mockDiscussionStore.setActiveDiscussion).toHaveBeenCalledWith(null);
    expect(mockRoomsStore.setActiveRoom).toHaveBeenCalledWith(null);
  });
});
