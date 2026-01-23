import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import ChatSummary from '../index.vue';

vi.mock('../stars.svg', () => ({
  default: 'mocked-stars-icon',
}));

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    sendSummaryFeedback: vi.fn(),
  },
}));

describe('ChatSummary', () => {
  let wrapper;
  let pinia;

  const createWrapper = (props = {}, options = {}) => {
    const defaultOptions = {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              rooms: {
                activeRoom: {
                  uuid: 'test-uuid',
                  ended_at: null,
                  user: { email: 'test@example.com' },
                },
                activeRoomSummary: {
                  status: 'DONE',
                  feedback: { liked: null },
                },
              },
              profile: {
                me: { email: 'test@example.com' },
              },
            },
          }),
        ],
        mocks: {
          $t: (key) => key,
        },
      },
      props,
    };

    return mount(ChatSummary, { ...defaultOptions, ...options });
  };

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render the component correctly', () => {
      wrapper = createWrapper();

      expect(wrapper.find('[data-testid="chat-summary"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="chat-summary-header"]').exists()).toBe(
        true,
      );
      expect(
        wrapper.find('[data-testid="chat-summary-by-ai-label"]').exists(),
      ).toBe(true);
    });

    it('should apply --open class when room is not ended', () => {
      wrapper = createWrapper();

      expect(wrapper.find('[data-testid="chat-summary"]').classes()).toContain(
        'chat-summary--open',
      );
    });

    it('should not apply --open class when room is ended', () => {
      wrapper = createWrapper(
        {},
        {
          global: {
            plugins: [
              createTestingPinia({
                createSpy: vi.fn,
                initialState: {
                  rooms: {
                    activeRoom: {
                      uuid: 'test-uuid',
                      ended_at: '2023-01-01T00:00:00Z',
                      user: { email: 'test@example.com' },
                    },
                    activeRoomSummary: {
                      status: 'DONE',
                      feedback: { liked: null },
                    },
                  },
                  profile: {
                    me: { email: 'test@example.com' },
                  },
                },
              }),
            ],
            mocks: {
              $t: (key) => key,
            },
          },
        },
      );

      expect(
        wrapper.find('[data-testid="chat-summary"]').classes(),
      ).not.toContain('chat-summary--open');
    });
  });

  describe('Header', () => {
    it('should not display close button when generating', () => {
      wrapper = createWrapper({
        isGeneratingSummary: true,
        hideClose: false,
      });

      const closeButton = wrapper.find(
        '[data-testid="chat-summary-close-button"]',
      );
      expect(closeButton.exists()).toBe(false);
    });

    it('should not display close button when hideClose is true', () => {
      wrapper = createWrapper({
        isGeneratingSummary: false,
        hideClose: true,
      });

      const closeButton = wrapper.find(
        '[data-testid="chat-summary-close-button"]',
      );
      expect(closeButton.exists()).toBe(false);
    });
  });

  describe('Content - Summary Generation', () => {
    it('should display 3 animated dots during generation', () => {
      wrapper = createWrapper({
        isGeneratingSummary: true,
      });

      const dots = wrapper.findAll(
        '[data-testid="chat-summary-generating-dot"]',
      );
      expect(dots).toHaveLength(3);
    });
  });

  describe('Content - Summary Text', () => {
    it('should apply is-typing class when typing', async () => {
      wrapper = createWrapper({
        isGeneratingSummary: false,
        summaryText: 'test text',
        hideClose: false,
      });

      await wrapper.setData({ isTyping: true });

      const textElement = wrapper.find('[data-testid="chat-summary-text"]');
      expect(textElement.classes()).toContain('is-typing');
    });

    it('should use skipAnimation when provided', () => {
      const summaryText = 'test text';
      wrapper = createWrapper({
        isGeneratingSummary: false,
        summaryText,
        skipAnimation: true,
      });

      const textElement = wrapper.find('[data-testid="chat-summary-text"]');
      expect(textElement.text()).toBe(summaryText);
    });
  });

  describe('Footer - Feedback', () => {
    it('should not display footer when user is not room owner', () => {
      wrapper = createWrapper(
        {},
        {
          global: {
            plugins: [
              createTestingPinia({
                createSpy: vi.fn,
                initialState: {
                  rooms: {
                    activeRoom: {
                      uuid: 'test-uuid',
                      ended_at: null,
                      user: { email: 'other@example.com' },
                    },
                    activeRoomSummary: {
                      status: 'DONE',
                      feedback: { liked: null },
                    },
                  },
                  profile: {
                    me: { email: 'test@example.com' },
                  },
                },
              }),
            ],
            mocks: {
              $t: (key) => key,
            },
          },
        },
      );

      const footer = wrapper.find('[data-testid="chat-summary-footer"]');
      expect(footer.exists()).toBe(false);
    });

    it('should not display footer when summary is not ready', () => {
      wrapper = createWrapper(
        {},
        {
          global: {
            plugins: [
              createTestingPinia({
                createSpy: vi.fn,
                initialState: {
                  rooms: {
                    activeRoom: {
                      uuid: 'test-uuid',
                      ended_at: null,
                      user: { email: 'test@example.com' },
                    },
                    activeRoomSummary: {
                      status: 'PROCESSING',
                      feedback: { liked: null },
                    },
                  },
                  profile: {
                    me: { email: 'test@example.com' },
                  },
                },
              }),
            ],
            mocks: {
              $t: (key) => key,
            },
          },
        },
      );

      const footer = wrapper.find('[data-testid="chat-summary-footer"]');
      expect(footer.exists()).toBe(false);
    });
  });

  describe('Methods', () => {
    it('should execute typeWriter correctly', async () => {
      wrapper = createWrapper();

      const text = 'Test';
      await wrapper.vm.typeWriter(text, 10);

      expect(wrapper.vm.animatedText).toBe(text);
      expect(wrapper.vm.isTyping).toBe(false);
    });

    it('should cancel previous animation when typeWriter is called again', async () => {
      wrapper = createWrapper();

      const promise1 = wrapper.vm.typeWriter('First animation text', 10);

      await new Promise((resolve) => setTimeout(resolve, 20));

      const promise2 = wrapper.vm.typeWriter('Second', 10);

      await promise1;
      await promise2;

      expect(wrapper.vm.animatedText).toBe('Second');
      expect(wrapper.vm.isTyping).toBe(false);
    });

    it('should increment currentAnimationId on each typeWriter call', async () => {
      wrapper = createWrapper();

      const initialId = wrapper.vm.currentAnimationId;

      await wrapper.vm.typeWriter('Test 1', 5);
      const idAfterFirst = wrapper.vm.currentAnimationId;

      await wrapper.vm.typeWriter('Test 2', 5);
      const idAfterSecond = wrapper.vm.currentAnimationId;

      expect(idAfterFirst).toBe(initialId + 1);
      expect(idAfterSecond).toBe(initialId + 2);
    });

    it('should abort animation controller on unmounted', () => {
      wrapper = createWrapper();
      wrapper.vm.animatedText = 'test';

      const abortSpy = vi.fn();
      wrapper.vm.animationAbortController = {
        abort: abortSpy,
        signal: { aborted: false },
      };

      wrapper.unmount();

      expect(abortSpy).toHaveBeenCalled();
      expect(wrapper.vm.animatedText).toBe('');
    });

    it('should clear animatedText on unmounted even without animation controller', () => {
      wrapper = createWrapper();
      wrapper.vm.animatedText = 'test';
      wrapper.vm.animationAbortController = null;

      wrapper.unmount();

      expect(wrapper.vm.animatedText).toBe('');
    });

    it('should handle animation cancellation error gracefully', async () => {
      wrapper = createWrapper();
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const promise1 = wrapper.vm.typeWriter('First text', 10);

      await new Promise((resolve) => setTimeout(resolve, 5));
      const promise2 = wrapper.vm.typeWriter('Second text', 10);

      await promise1;
      await promise2;

      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Animation cancelled' }),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Feedback Modal', () => {
    it('should close modal when handleCloseFeedbackModal is called', async () => {
      wrapper = createWrapper();
      wrapper.vm.showFeedbackModal = true;
      wrapper.vm.hasFeedback = true;

      await wrapper.vm.handleCloseFeedbackModal();

      expect(wrapper.vm.showFeedbackModal).toBe(false);
      expect(wrapper.vm.hasFeedback).toBe(false);
    });

    it('should emit close when handleCloseFeedbackModal is called with closeSummary', async () => {
      wrapper = createWrapper();
      wrapper.vm.showFeedbackModal = true;

      await wrapper.vm.handleCloseFeedbackModal({ closeSummary: true });

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Watchers', () => {
    it('should execute typeWriter when summaryText changes and skipAnimation is false', async () => {
      const typeWriterSpy = vi.spyOn(ChatSummary.methods, 'typeWriter');

      wrapper = createWrapper({
        summaryText: '',
        skipAnimation: false,
      });

      await wrapper.setProps({
        summaryText: 'New text',
      });

      expect(typeWriterSpy).toHaveBeenCalledWith('New text', 10);
    });

    it('should set animatedText directly when skipAnimation is true', async () => {
      wrapper = createWrapper({
        summaryText: '',
        skipAnimation: true,
      });

      await wrapper.setProps({
        summaryText: 'New text',
      });

      expect(wrapper.vm.animatedText).toBe('New text');
    });

    it('should not restart animation if already typing the same text', async () => {
      const typeWriterSpy = vi.spyOn(ChatSummary.methods, 'typeWriter');

      wrapper = createWrapper({
        summaryText: 'Same text',
        skipAnimation: false,
      });

      await wrapper.vm.$nextTick();

      wrapper.vm.isTyping = true;
      const callCountBefore = typeWriterSpy.mock.calls.length;

      await wrapper.setProps({
        summaryText: 'Same text',
      });

      await wrapper.vm.$nextTick();

      expect(typeWriterSpy.mock.calls.length).toBe(callCountBefore);
    });

    it('should restart animation if text changes while typing', async () => {
      wrapper = createWrapper({
        summaryText: 'First text',
        skipAnimation: false,
      });

      await wrapper.vm.$nextTick();

      wrapper.vm.isTyping = true;
      const initialAnimationId = wrapper.vm.currentAnimationId;

      await wrapper.setProps({
        summaryText: 'Different text',
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.currentAnimationId).toBeGreaterThan(initialAnimationId);
    });
  });
});
