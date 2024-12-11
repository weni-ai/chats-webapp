import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';

import { sendWindowNotification } from '@/utils/notifications';
import SoundNotification from '@/services/api/websocket/soundNotification';

import wsDiscussionCreateMessage from '../create';

vi.mock('@/utils/notifications', () => ({
  sendWindowNotification: vi.fn(),
}));

vi.mock('@/services/api/websocket/soundNotification', () => ({
  default: vi.fn().mockImplementation(() => ({
    notify: vi.fn(),
  })),
}));

vi.mock('@/services/api/websocket/soundNotification');

vi.mock('@/store/modules/chats/discussions', () => ({
  useDiscussions: vi.fn(),
}));

vi.mock('@/store/modules/chats/discussionMessages', () => ({
  useDiscussionMessages: vi.fn(),
}));

describe('Create discussion message service', () => {
  let mockDiscussionStore,
    mockDiscussionMessagesStore,
    mockApp,
    soundNotificationMock;

  beforeEach(() => {
    mockDiscussionStore = {
      discussions: [{ uuid: '123', name: 'Test Discussion' }],
      activeDiscussion: { uuid: '123' },
      addNewMessagesByDiscussion: vi.fn(),
    };

    mockDiscussionMessagesStore = {
      addDiscussionMessage: vi.fn(),
    };

    mockApp = {
      me: { email: 'user@example.com' },
      $route: {
        name: 'discussion',
        params: { discussionId: '123' },
      },
    };

    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);

    soundNotificationMock = new SoundNotification('ping-bing');
    SoundNotification.mockReturnValue(soundNotificationMock);

    useDiscussions.mockReturnValue(mockDiscussionStore);
    useDiscussionMessages.mockReturnValue(mockDiscussionMessagesStore);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('handles a message for an existing discussion', async () => {
    const message = {
      discussion: '123',
      text: 'Hello!',
      user: {
        email: 'another@example.com',
        first_name: 'John',
        last_name: 'Doe',
      },
      media: [],
      created_on: '2024-12-10T12:00:00Z',
      uuid: 'message-uuid',
    };

    await wsDiscussionCreateMessage(message, { app: mockApp });

    expect(SoundNotification).toHaveBeenCalledWith('ping-bing');
    expect(soundNotificationMock.notify).toHaveBeenCalled();

    expect(sendWindowNotification).toHaveBeenCalledWith({
      title: 'John Doe',
      message: 'Hello!',
      image: undefined,
    });

    expect(
      mockDiscussionMessagesStore.addDiscussionMessage,
    ).toHaveBeenCalledWith({
      message,
    });

    expect(
      mockDiscussionStore.addNewMessagesByDiscussion,
    ).not.toHaveBeenCalled();
  });

  it('does nothing if the message is sent by the current user', () => {
    const message = {
      discussion: '123',
      text: 'Hello!',
      user: { email: 'user@example.com' },
    };

    wsDiscussionCreateMessage(message, { app: mockApp });

    expect(sendWindowNotification).not.toHaveBeenCalled();

    expect(
      mockDiscussionMessagesStore.addDiscussionMessage,
    ).not.toHaveBeenCalled();
    expect(
      mockDiscussionStore.addNewMessagesByDiscussion,
    ).not.toHaveBeenCalled();
  });
});
