import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AssistantMessageList from '../AssistantMessageList.vue';

const createWrapper = (props = {}) =>
  mount(AssistantMessageList, {
    props: {
      messages: [],
      ...props,
    },
    global: {
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
          template: '<div data-testid="assistant-ai-message" />',
          props: ['text', 'suggestion', 'status', 'type', 'media', 'filename'],
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

describe('AssistantMessageList', () => {
  let wrapper;

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
  });
});
