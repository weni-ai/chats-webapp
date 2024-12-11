import { describe, it, expect, vi, beforeEach } from 'vitest';
import SoundNotification from '@/services/api/websocket/soundNotification';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useRooms } from '@/store/modules/chats/rooms';
import wsDiscussionUpdate from '@/services/api/websocket/listeners/discussion/update';

vi.mock('@/services/api/websocket/soundNotification');
vi.mock('@/store/modules/chats/discussions');
vi.mock('@/store/modules/chats/rooms');

describe('Discussion update', () => {
  let mockDiscussionStore;
  let mockRoomsStore;
  let mockApp;

  beforeEach(() => {
    mockDiscussionStore = {
      discussions: [],
      activeDiscussion: null,
      addDiscussion: vi.fn(),
      setActiveDiscussion: vi.fn(),
      removeDiscussion: vi.fn(),
    };
    useDiscussions.mockReturnValue(mockDiscussionStore);

    mockRoomsStore = {
      setActiveRoom: vi.fn(),
    };
    useRooms.mockReturnValue(mockRoomsStore);

    mockApp = {
      me: { email: 'user@example.com' },
    };

    SoundNotification.mockClear();
  });

  it('adds a new discussion and plays a sound notification', () => {
    const discussion = {
      uuid: '123',
      created_by: 'another@example.com',
      added_agents: [],
    };

    wsDiscussionUpdate(discussion, { app: mockApp });

    expect(mockDiscussionStore.addDiscussion).toHaveBeenCalledWith(discussion);
    expect(SoundNotification).toHaveBeenCalledWith('achievement-confirmation');
    expect(SoundNotification.prototype.notify).toHaveBeenCalled();
  });

  it('does not add a discussion if it already exists', () => {
    const discussion = {
      uuid: '123',
      created_by: 'another@example.com',
      added_agents: [],
    };

    mockDiscussionStore.discussions = [
      { uuid: '123', created_by: 'another@example.com' },
    ];

    wsDiscussionUpdate(discussion, { app: mockApp });

    expect(mockDiscussionStore.addDiscussion).not.toHaveBeenCalled();

    expect(SoundNotification).not.toHaveBeenCalled();
  });

  it('updates the active discussion and resets active room', () => {
    const discussion = { uuid: '123', added_agents: [] };
    mockDiscussionStore.activeDiscussion = { uuid: '123' };

    wsDiscussionUpdate(discussion, { app: mockApp });

    expect(mockDiscussionStore.setActiveDiscussion).toHaveBeenCalledWith(
      discussion,
    );
    expect(mockRoomsStore.setActiveRoom).toHaveBeenCalledWith(null);
  });

  it('removes a discussion when conditions are met', () => {
    const discussion = {
      uuid: '123',
      created_by: 'another@example.com',
      added_agents: ['agent1@example.com', 'agent2@example.com'],
    };

    wsDiscussionUpdate(discussion, { app: mockApp });

    expect(mockDiscussionStore.removeDiscussion).toHaveBeenCalledWith('123');
  });

  it('does not perform any action if no conditions are met', () => {
    const discussion = {
      uuid: '123',
      created_by: 'user@example.com',
      added_agents: [],
    };

    wsDiscussionUpdate(discussion, { app: mockApp });

    expect(mockDiscussionStore.addDiscussion).not.toHaveBeenCalled();
    expect(SoundNotification).not.toHaveBeenCalled();
    expect(mockDiscussionStore.setActiveDiscussion).not.toHaveBeenCalled();
    expect(mockRoomsStore.setActiveRoom).not.toHaveBeenCalled();
    expect(mockDiscussionStore.removeDiscussion).not.toHaveBeenCalled();
  });
});
