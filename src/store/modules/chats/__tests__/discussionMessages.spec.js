import { setActivePinia, createPinia } from 'pinia';
import { useDiscussionMessages } from '../discussionMessages';
import Message from '@/services/api/resources/chats/message';
import { vi } from 'vitest';

vi.mock('@/services/api/resources/chats/message', () => ({
  default: {
    sendDiscussionMessage: vi.fn(),
    sendDiscussionMedia: vi.fn(),
    getByDiscussion: vi.fn(),
  },
}));

vi.mock('@/store/modules/chats/discussions', () => ({
  useDiscussions: vi.fn(() => ({
    activeDiscussion: { uuid: 'discussion-uuid', user: {} },
  })),
}));

vi.mock('@/store/modules/profile', () => ({
  useProfile: vi.fn(() => ({ me: { id: 'user-id' } })),
}));

describe('discussionMessages Store', () => {
  let store;
  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDiscussionMessages();
  });

  it('initializes with correct state', () => {
    expect(store.discussionMessages).toEqual([]);
    expect(store.discussionMessagesSorted).toEqual([]);
    expect(store.discussionMessagesSendingUuids).toEqual([]);
  });

  it('adds a discussion message', () => {
    const message = {
      uuid: 'message-uuid',
      text: 'Hello',
      discussion: 'discussion-uuid',
    };
    store.addDiscussionMessage({ message });
    expect(store.discussionMessages).toContainEqual(
      expect.objectContaining(message),
    );
  });

  it('sends a discussion message', async () => {
    Message.sendDiscussionMessage.mockResolvedValue({
      uuid: 'message-uuid',
      text: 'Hello',
      discussion: 'discussion-uuid',
    });

    await store.sendDiscussionMessage('Hello');
    expect(Message.sendDiscussionMessage).toHaveBeenCalledWith(
      'discussion-uuid',
      { text: 'Hello' },
    );
  });

  it('updates a discussion message', () => {
    const message = { uuid: 'message-uuid', text: 'Hello' };
    store.discussionMessages.push(message);
    store.updateDiscussionMessage({ message: { ...message, text: 'Updated' } });
    expect(store.discussionMessages[0].text).toBe('Updated');
  });

  it('removes a failed message', () => {
    const message = { uuid: 'failed-uuid' };
    store.discussionMessagesFailedUuids.push(message.uuid);
    store.removeMessageFromFaileds(message.uuid);
    expect(store.discussionMessagesFailedUuids).not.toContain(message.uuid);
  });

  it('fetches discussion messages', async () => {
    Message.getByDiscussion.mockResolvedValue({
      results: [{ uuid: 'msg-uuid' }],
    });
    await store.getDiscussionMessages({ offset: 0, limit: 10 });
    expect(store.discussionMessages.length).toBeGreaterThan(0);
  });

  it('resends a discussion message', async () => {
    const message = { uuid: 'message-uuid', text: 'Hello' };
    Message.sendDiscussionMessage.mockResolvedValue(message);
    await store.resendDiscussionMessage({ message });
    expect(Message.sendDiscussionMessage).toHaveBeenCalled();
  });
});
