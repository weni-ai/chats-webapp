import { describe, it, expect, vi, beforeEach } from 'vitest';
import wsDiscussionCreate from '@/services/api/websocket/listeners/discussion/create';
import { useDiscussions } from '@/store/modules/chats/discussions';
import SoundNotification from '@/services/api/websocket/soundNotification';

vi.mock('@/store/modules/chats/discussions', () => ({
  useDiscussions: vi.fn(),
}));

vi.mock('@/services/api/websocket/soundNotification', () => ({
  default: vi.fn().mockImplementation(() => ({
    notify: vi.fn(),
  })),
}));

describe('Discussion create', () => {
  let appMock;
  let discussionsStoreMock;
  let soundNotificationMock;

  beforeEach(() => {
    appMock = {
      me: {
        email: 'user@example.com',
      },
    };

    discussionsStoreMock = {
      discussions: [],
      addDiscussion: vi.fn(),
    };

    useDiscussions.mockReturnValue(discussionsStoreMock);

    soundNotificationMock = new SoundNotification('select-sound');
    SoundNotification.mockReturnValue(soundNotificationMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add the discussion if the created_by is not equal to app.me.email', () => {
    const discussion = { created_by: 'other@example.com' };

    wsDiscussionCreate(discussion, { app: appMock });

    console.log(useDiscussions.addDiscussion);

    expect(discussionsStoreMock.addDiscussion).toHaveBeenCalled();
    expect(soundNotificationMock.notify).toHaveBeenCalled();
  });

  it('does not add discussion created by the current user', () => {
    const discussion = { created_by: 'user@example.com', uuid: '123' };
    wsDiscussionCreate(discussion, { app: appMock });

    expect(discussionsStoreMock.addDiscussion).not.toHaveBeenCalled();
  });

  it('does not add duplicate discussions', () => {
    const discussion = { created_by: 'other@example.com', uuid: '123' };
    discussionsStoreMock.discussions.push(discussion);

    wsDiscussionCreate(discussion, { app: appMock });

    expect(discussionsStoreMock.addDiscussion).not.toHaveBeenCalled();
  });
});
