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
  useProfile: vi.fn(() => ({ me: { id: 'user-id', email: 'test@test.com' } })),
}));

describe('discussionMessages Store', () => {
  let discussionMessageStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    discussionMessageStore = useDiscussionMessages();
  });

  it('initializes with correct state', () => {
    expect(discussionMessageStore.discussionMessages).toEqual([]);
    expect(discussionMessageStore.discussionMessagesSorted).toEqual([]);
    expect(discussionMessageStore.discussionMessagesSendingUuids).toEqual([]);
  });

  it('adds a discussion message', () => {
    const message = {
      uuid: 'message-uuid',
      text: 'Hello',
      discussion: 'discussion-uuid',
    };
    discussionMessageStore.addDiscussionMessage({ message });
    expect(discussionMessageStore.discussionMessages).toContainEqual(
      expect.objectContaining(message),
    );
  });

  it('sends a discussion message', async () => {
    Message.sendDiscussionMessage.mockResolvedValue({
      uuid: 'message-uuid',
      text: 'Hello',
      discussion: 'discussion-uuid',
    });

    await discussionMessageStore.sendDiscussionMessage('Hello');
    expect(Message.sendDiscussionMessage).toHaveBeenCalledWith(
      'discussion-uuid',
      { text: 'Hello' },
    );
  });

  it('updates a discussion message', () => {
    const message = { uuid: 'message-uuid', text: 'Hello' };
    discussionMessageStore.discussionMessages.push(message);
    discussionMessageStore.updateDiscussionMessage({
      message: { ...message, text: 'Updated' },
    });
    expect(discussionMessageStore.discussionMessages[0].text).toBe('Updated');
  });

  it('removes a failed message', () => {
    const message = { uuid: 'failed-uuid' };
    discussionMessageStore.discussionMessagesFailedUuids.push(message.uuid);
    discussionMessageStore.removeMessageFromFaileds(message.uuid);
    expect(discussionMessageStore.discussionMessagesFailedUuids).not.toContain(
      message.uuid,
    );
  });

  it('fetches discussion messages', async () => {
    Message.getByDiscussion.mockResolvedValue({
      results: [{ uuid: 'msg-uuid' }],
    });
    await discussionMessageStore.getDiscussionMessages({
      offset: 0,
      limit: 10,
    });
    expect(discussionMessageStore.discussionMessages.length).toBeGreaterThan(0);
  });

  it('resends a discussion message', async () => {
    const message = { uuid: 'message-uuid', text: 'Hello' };
    Message.sendDiscussionMessage.mockResolvedValue(message);
    await discussionMessageStore.resendDiscussionMessage({ message });
    expect(Message.sendDiscussionMessage).toHaveBeenCalled();
  });

  it('should reset discussion messages', () => {
    discussionMessageStore.discussionMessages = [{ uuid: '123' }];
    discussionMessageStore.discussionMessagesNext = 'next';
    discussionMessageStore.discussionMessagesPrevious = 'prev';

    discussionMessageStore.resetDiscussionMessages();
    expect(discussionMessageStore.discussionMessages).toEqual([]);
    expect(discussionMessageStore.discussionMessagesNext).toBe('');
    expect(discussionMessageStore.discussionMessagesPrevious).toBe('');
  });

  it('should add a message to the failed list if it belongs to the active discussion', () => {
    const message = {
      uuid: 'message-1',
      discussion: 'discussion-uuid',
      user: { email: 'test@test.com' },
    };

    discussionMessageStore.addFailedDiscussionMessage({ message });

    expect(discussionMessageStore.discussionMessagesFailedUuids).toContain(
      'message-1',
    );
    expect(discussionMessageStore.discussionMessagesSendingUuids).not.toContain(
      'message-1',
    );
  });

  it('should resend all failed messages in order', async () => {
    discussionMessageStore.discussionMessagesSendingUuids = [
      'msg-1',
      'msg-2',
      'msg-3',
    ];
    discussionMessageStore.discussionMessages = [
      { uuid: 'msg-1', text: 'Hello' },
      { uuid: 'msg-2', text: 'World' },
      { uuid: 'msg-3', text: 'Test' },
    ];

    discussionMessageStore.resendDiscussionMessage = vi.fn();

    await discussionMessageStore.resendDiscussionMessages();

    expect(
      discussionMessageStore.resendDiscussionMessage,
    ).toHaveBeenCalledTimes(3);
    expect(
      discussionMessageStore.resendDiscussionMessage,
    ).toHaveBeenNthCalledWith(1, {
      message: { uuid: 'msg-1', text: 'Hello' },
    });
    expect(
      discussionMessageStore.resendDiscussionMessage,
    ).toHaveBeenNthCalledWith(2, {
      message: { uuid: 'msg-2', text: 'World' },
    });
    expect(
      discussionMessageStore.resendDiscussionMessage,
    ).toHaveBeenNthCalledWith(3, {
      message: { uuid: 'msg-3', text: 'Test' },
    });
  });
});
