import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ChatMessages from '../index.vue';
import { useDashboard } from '@/store/modules/dashboard';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useRooms } from '@/store/modules/chats/rooms';
import moment from 'moment';

// Mock components
vi.mock('@/views/loadings/chat/ChatMessages.vue', () => ({
  default: {
    name: 'ChatMessagesLoading',
    template: '<div class="mock-loading">Loading</div>',
  },
}));

vi.mock('@/components/TagGroup.vue', () => ({
  default: {
    name: 'TagGroup',
    template: '<div class="mock-tag-group">Tag Group</div>',
  },
}));

vi.mock('@/components/chats/MediaMessage/Previews/Video.vue', () => ({
  default: {
    name: 'VideoPlayer',
    template: '<div class="mock-video-player">Video Player</div>',
  },
}));

vi.mock('@/components/chats/MediaMessage/Previews/Fullscreen.vue', () => ({
  default: {
    name: 'FullscreenPreview',
    template: '<div class="mock-fullscreen">Fullscreen Preview</div>',
  },
}));

vi.mock('../ChatFeedback.vue', () => ({
  default: {
    name: 'ChatFeedback',
    template: '<div class="mock-chat-feedback">Chat Feedback</div>',
  },
}));

vi.mock('./ChatMessagesStartFeedbacks.vue', () => ({
  default: {
    name: 'ChatMessagesStartFeedbacks',
    template: '<div class="mock-start-feedbacks">Start Feedbacks</div>',
  },
}));

vi.mock('./ChatMessagesFeedbackMessage.vue', () => ({
  default: {
    name: 'ChatMessagesFeedbackMessage',
    template: '<div class="mock-feedback-message">Feedback Message</div>',
  },
}));

describe('ChatMessages', () => {
  let wrapper;
  let pinia;
  let dashboardStore;
  let roomMessagesStore;
  let roomsStore;

  const mockMessages = [
    {
      uuid: '1',
      text: 'Hello',
      created_on: '2024-03-20T10:00:00Z',
      user: { email: 'agent@example.com', first_name: 'Agent' },
      media: [],
    },
    {
      uuid: '2',
      text: 'Hi there',
      created_on: '2024-03-20T10:01:00Z',
      contact: { email: 'contact@example.com' },
      media: [],
    },
  ];

  const mockMessagesSorted = [
    {
      date: '2024-03-20',
      minutes: [
        {
          minute: '10:00',
          messages: mockMessages,
        },
      ],
    },
  ];

  const defaultProps = {
    chatUuid: 'chat-123',
    messages: mockMessages,
    messagesNext: 'next-page',
    messagesPrevious: 'prev-page',
    messagesSorted: mockMessagesSorted,
    messagesSendingUuids: [],
    messagesFailedUuids: [],
    resendMessages: vi.fn(),
    resendMedia: vi.fn(),
    tags: [],
    showWaitingFeedback: false,
    showChatSeparator: true,
    isLoading: false,
    isClosedChat: false,
  };

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    dashboardStore = useDashboard();
    roomMessagesStore = useRoomMessages();
    roomsStore = useRooms();

    // Mock store state
    dashboardStore.viewedAgent = { email: 'agent@example.com' };
    roomsStore.activeRoom = { uuid: 'room-123' };

    wrapper = mount(ChatMessages, {
      props: defaultProps,
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key) => key,
        },
      },
    });
  });

  it('renders properly with required props', () => {
    expect(wrapper.exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="chat-messages-container"]').exists(),
    ).toBe(true);
  });

  it('shows loading skeleton when isLoading is true and chatUuid changes', async () => {
    await wrapper.setProps({
      isLoading: true,
      chatUuid: 'new-chat-123',
    });

    expect(wrapper.find('.mock-loading').exists()).toBe(true);
  });

  it('displays messages when not loading', () => {
    expect(wrapper.find('[data-testid="chat-messages"]').exists()).toBe(true);
  });

  it('handles scroll events', async () => {
    const chatMessages = wrapper.find('[data-testid="chat-messages"]');
    await chatMessages.trigger('scroll');

    // Verify scroll event handler is called
    expect(wrapper.emitted('scrollTop')).toBeTruthy();
  });

  it('formats message title correctly', () => {
    const date = new Date('2024-03-20T10:00:00Z');
    const formattedTitle = wrapper.vm.messageFormatTitle(date);
    expect(formattedTitle).toBe(
      `${moment(date).format('HH:mm')} | ${moment(date).format('L')}`,
    );
  });

  it('handles message reply', async () => {
    const message = { uuid: '1', text: 'Test message' };
    await wrapper.vm.handlerMessageReply(message);

    expect(roomMessagesStore.replyMessage).toEqual(message);
  });

  it('identifies media types correctly', () => {
    const imageMedia = { content_type: 'image/jpeg' };
    const videoMedia = { content_type: 'video/mp4' };
    const audioMedia = { content_type: 'audio/mp3' };

    expect(wrapper.vm.isImage(imageMedia)).toBe(true);
    expect(wrapper.vm.isVideo(videoMedia)).toBe(true);
    expect(wrapper.vm.isAudio(audioMedia)).toBe(true);
  });

  describe('Message highlighting', () => {
    it('adds highlighted class to message when highlightedMessageUuid matches', async () => {
      const message = {
        uuid: 'test-uuid',
        text: 'Test message',
        created_on: '2024-03-20T10:00:00Z',
        user: { email: 'agent@example.com' },
      };

      await wrapper.setProps({
        messages: [message],
        messagesSorted: [
          {
            date: '2024-03-20',
            minutes: [
              {
                minute: '10:00',
                messages: [message],
              },
            ],
          },
        ],
      });

      wrapper.vm.highlightedMessageUuid = 'test-uuid';
      await wrapper.vm.$nextTick();

      const messageElement = wrapper.find('[data-testid="chat-message"]');
      expect(messageElement.classes()).toContain('highlighted');
    });

    it('removes highlighted class after animation timeout', async () => {
      vi.useFakeTimers();

      const messageToHighlight = {
        uuid: 'test-uuid',
        text: 'Test message',
        created_on: '2024-03-20T10:00:00Z',
        user: { email: 'agent@example.com' },
      };

      await wrapper.setProps({
        messages: [messageToHighlight],
        messagesSorted: [
          {
            date: '2024-03-20',
            minutes: [
              {
                minute: '10:00',
                messages: [messageToHighlight],
              },
            ],
          },
        ],
      });

      const scrollIntoViewMock = vi.fn();
      const originalScrollIntoView = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      try {
        await wrapper.vm.handlerClickReplyMessage(messageToHighlight);
        await wrapper.vm.$nextTick();

        const messageElement = wrapper.find('[data-testid="chat-message"]');
        expect(messageElement.exists()).toBe(true);
        expect(messageElement.classes()).toContain('highlighted');
        expect(wrapper.vm.highlightedMessageUuid).toBe(messageToHighlight.uuid);

        vi.advanceTimersByTime(1000);
        await flushPromises();

        expect(wrapper.vm.highlightedMessageUuid).toBeNull();
        expect(messageElement.classes()).not.toContain('highlighted');
      } finally {
        Element.prototype.scrollIntoView = originalScrollIntoView;
        vi.useRealTimers();
      }
    });
  });
});
