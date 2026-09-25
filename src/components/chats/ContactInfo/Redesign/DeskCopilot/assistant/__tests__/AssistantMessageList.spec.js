import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AssistantMessageList from '../AssistantMessageList.vue';
import { useRooms } from '@/store/modules/chats/rooms';
import CopilotFeedback from '@/services/api/resources/chats/copilotFeedback';

vi.mock('@/services/api/resources/chats/copilotFeedback', () => ({
  default: {
    getRoomFeedbacks: vi.fn(),
    getMessageFeedbackTags: vi.fn(() => []),
    sendMessageFeedback: vi.fn(),
  },
}));

const createWrapper = (props = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const roomsStore = useRooms();
  roomsStore.$patch({
    activeRoom: { uuid: 'room-1' },
  });

  return mount(AssistantMessageList, {
    props: {
      messages: [],
      ...props,
    },
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicSkeletonLoading: {
          name: 'UnnnicSkeletonLoading',
          template: '<div data-testid="assistant-history-skeleton" />',
        },
        HumanMessage: {
          name: 'AssistantHumanMessage',
          template: '<div data-testid="assistant-human-message" />',
          props: ['text', 'type', 'media', 'filename'],
        },
        AiMessage: {
          name: 'AssistantAiMessage',
          template:
            '<div data-testid="assistant-ai-message" @click="$emit(\'sendCatalog\', { catalog: { carousel: true, products: [] }, text: \'Catalog text\' })" />',
          props: [
            'messageId',
            'text',
            'suggestion',
            'status',
            'type',
            'media',
            'filename',
            'productCarousel',
            'productList',
            'getQuantity',
            'readOnly',
            'liked',
          ],
        },
        ThinkingIndicator: {
          name: 'AssistantThinkingIndicator',
          template: '<div data-testid="assistant-thinking-indicator" />',
        },
        TypingIndicator: {
          name: 'AssistantTypingIndicator',
          template: '<div data-testid="assistant-typing-indicator" />',
        },
      },
    },
  });
};

describe('AssistantMessageList', () => {
  let wrapper;

  beforeEach(() => {
    CopilotFeedback.getRoomFeedbacks.mockResolvedValue([]);
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('shows the history loading state when there are no messages yet', () => {
    wrapper = createWrapper({ isLoadingHistory: true });

    expect(
      wrapper.find('[data-testid="assistant-history-loading"]').exists(),
    ).toBe(true);
  });

  it('hides the history loading state after messages arrive', () => {
    wrapper = createWrapper({
      isLoadingHistory: true,
      messages: [
        {
          id: '1',
          direction: 'human',
          text: 'Hello',
          quickReplies: [],
          status: 'sent',
          timestamp: 1,
        },
      ],
    });

    expect(
      wrapper.find('[data-testid="assistant-history-loading"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="assistant-human-message"]').exists(),
    ).toBe(true);
  });

  it('shows the thinking indicator while the assistant is processing', () => {
    wrapper = createWrapper({ isThinking: true });

    expect(
      wrapper.find('[data-testid="assistant-thinking-indicator"]').exists(),
    ).toBe(true);
  });

  it('shows the typing indicator while waiting for a reply', () => {
    wrapper = createWrapper({ isTyping: true });

    expect(
      wrapper.find('[data-testid="assistant-typing-indicator"]').exists(),
    ).toBe(true);
  });

  it('prefers thinking over typing when both are active', () => {
    wrapper = createWrapper({ isTyping: true, isThinking: true });

    expect(
      wrapper.find('[data-testid="assistant-thinking-indicator"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="assistant-typing-indicator"]').exists(),
    ).toBe(false);
  });

  it('passes message status to AiMessage for streaming replies', () => {
    wrapper = createWrapper({
      messages: [
        {
          id: 'ai-1',
          direction: 'ai',
          text: 'Hello world',
          quickReplies: [],
          status: 'streaming',
          timestamp: 1,
        },
      ],
    });

    const aiMessage = wrapper.findComponent({ name: 'AssistantAiMessage' });
    expect(aiMessage.props('status')).toBe('streaming');
    expect(aiMessage.props('messageId')).toBe('ai-1');
  });

  it('passes productList to AiMessage when present', () => {
    const productList = {
      text: 'Available TVs',
      header: 'TV selection',
      sections: [
        {
          title: 'TV 32',
          items: [
            {
              product_retailer_id: 'tv-32-1',
              name: 'Smart TV 32"',
              price: 1099,
              currency: 'BRL',
              image: 'https://example.com/tv32.png',
            },
          ],
        },
      ],
    };

    wrapper = createWrapper({
      messages: [
        {
          id: 'ai-2',
          direction: 'ai',
          text: 'Available TVs',
          quickReplies: [],
          status: 'delivered',
          timestamp: 1,
          productList,
        },
      ],
    });

    const aiMessage = wrapper.findComponent({ name: 'AssistantAiMessage' });
    expect(aiMessage.props('productList')).toEqual(productList);
  });

  it('passes readOnly to AiMessage', () => {
    wrapper = createWrapper({
      readOnly: true,
      messages: [
        {
          id: 'ai-3',
          direction: 'ai',
          text: 'History reply',
          quickReplies: [],
          status: 'delivered',
          timestamp: 1,
        },
      ],
    });

    const aiMessage = wrapper.findComponent({ name: 'AssistantAiMessage' });
    expect(aiMessage.props('readOnly')).toBe(true);
  });

  it('passes persisted liked state from room feedback', async () => {
    CopilotFeedback.getRoomFeedbacks.mockResolvedValue([
      { message_id: 'ai-1', liked: true, text: '', tags: [] },
    ]);

    wrapper = createWrapper({
      messages: [
        {
          id: 'ai-1',
          direction: 'ai',
          text: 'Hello world',
          quickReplies: [],
          status: 'delivered',
          timestamp: 1,
        },
      ],
    });
    await flushPromises();

    expect(CopilotFeedback.getRoomFeedbacks).toHaveBeenCalledWith({
      roomUuid: 'room-1',
    });
    expect(
      wrapper.findComponent({ name: 'AssistantAiMessage' }).props('liked'),
    ).toBe(true);
  });
});
