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

  describe('Archived Messages', () => {
    it('should not display archived section when isArchived is false', () => {
      wrapper = createWrapper({
        isArchived: false,
        archivedUrl: 'https://example.com/archive.zip',
      });

      const archivedSection = wrapper.find(
        '[data-testid="chat-summary-archived"]',
      );
      expect(archivedSection.exists()).toBe(false);
    });

    it('should not display archived section when archivedUrl is empty', () => {
      wrapper = createWrapper({
        isArchived: true,
        archivedUrl: '',
      });

      const archivedSection = wrapper.find(
        '[data-testid="chat-summary-archived"]',
      );
      expect(archivedSection.exists()).toBe(false);
    });

    it('should display archived section when both isArchived and archivedUrl are provided', () => {
      wrapper = createWrapper({
        isArchived: true,
        archivedUrl: 'https://example.com/archive.zip',
      });

      const archivedSection = wrapper.find(
        '[data-testid="chat-summary-archived"]',
      );
      expect(archivedSection.exists()).toBe(true);
    });

    it('should call handleDownload when download button is clicked', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
      const archivedUrl = 'https://example.com/archive.zip';

      wrapper = createWrapper({
        isArchived: true,
        archivedUrl,
      });

      const archivedSection = wrapper.find(
        '[data-testid="chat-summary-archived"]',
      );
      const downloadButton = archivedSection.findComponent({ name: 'UnnnicButton' });

      await downloadButton.vm.$emit('click');

      expect(windowOpenSpy).toHaveBeenCalledWith(archivedUrl, '_blank');

      windowOpenSpy.mockRestore();
    });

    it('should open archived URL in new tab when handleDownload is called', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
      const archivedUrl = 'https://example.com/archive.zip';

      wrapper = createWrapper({
        isArchived: true,
        archivedUrl,
      });

      wrapper.vm.handleDownload();

      expect(windowOpenSpy).toHaveBeenCalledWith(archivedUrl, '_blank');

      windowOpenSpy.mockRestore();
    });

    it('should not open URL when archivedUrl is empty in handleDownload', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

      wrapper = createWrapper({
        isArchived: true,
        archivedUrl: '',
      });

      wrapper.vm.handleDownload();

      expect(windowOpenSpy).not.toHaveBeenCalled();

      windowOpenSpy.mockRestore();
    });

    it('should show error alert when download fails', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {
        throw new Error('Network error');
      });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockAlert = vi.fn();
      const mockT = vi.fn((key) => {
        if (key === 'chats.summary.archived.download_error') {
          return 'Error downloading messages. Please try again.';
        }
        return key;
      });

      wrapper = createWrapper(
        {
          isArchived: true,
          archivedUrl: 'https://example.com/archive.zip',
        },
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
              $t: mockT,
            },
          },
        },
      );

      wrapper.vm.$unnnic = {
        call: {
          alert: mockAlert,
        },
      };

      wrapper.vm.handleDownload();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error downloading archived messages:',
        expect.any(Error),
      );

      expect(mockAlert).toHaveBeenCalledWith({
        props: {
          text: 'Error downloading messages. Please try again.',
          type: 'error',
        },
      });

      windowOpenSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Animation Race Condition (Bug Prevention)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should prevent text duplication when summaryText updates during animation', async () => {
      wrapper = createWrapper({
        summaryText: '',
        skipAnimation: false,
      });

      await wrapper.setProps({
        summaryText: 'First text',
      });
      await wrapper.vm.$nextTick();

      await vi.advanceTimersByTimeAsync(50);

      await wrapper.setProps({
        summaryText: 'Second text',
      });
      await wrapper.vm.$nextTick();

      await vi.advanceTimersByTimeAsync(150);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.animatedText).toBe('Second text');
      expect(wrapper.vm.animatedText).not.toContain('First');
      expect(wrapper.vm.isTyping).toBe(false);
    });

    it('should handle rapid successive text changes without text mixing', async () => {
      wrapper = createWrapper({
        summaryText: '',
        skipAnimation: false,
      });

      await wrapper.setProps({ summaryText: 'Text1' });
      await wrapper.vm.$nextTick();
      await vi.advanceTimersByTimeAsync(10);

      await wrapper.setProps({ summaryText: 'Text2' });
      await wrapper.vm.$nextTick();
      await vi.advanceTimersByTimeAsync(10);

      await wrapper.setProps({ summaryText: 'Text3' });
      await wrapper.vm.$nextTick();
      await vi.advanceTimersByTimeAsync(10);

      await wrapper.setProps({ summaryText: 'Final' });
      await wrapper.vm.$nextTick();

      await vi.advanceTimersByTimeAsync(100);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.animatedText).toBe('Final');
      expect(wrapper.vm.isTyping).toBe(false);
    });

    it('should cancel animation when component is unmounted mid-animation', async () => {
      wrapper = createWrapper({
        summaryText: 'Very long text that takes time to animate',
        skipAnimation: false,
      });

      await wrapper.vm.$nextTick();
      await vi.advanceTimersByTimeAsync(50);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isTyping).toBe(true);
      expect(wrapper.vm.animatedText.length).toBeGreaterThan(0);
      expect(wrapper.vm.animatedText.length).toBeLessThan(
        'Very long text that takes time to animate'.length,
      );

      wrapper.unmount();

      expect(wrapper.vm.animatedText).toBe('');
    });

    it('should handle multiple animation starts with proper cleanup', async () => {
      wrapper = createWrapper({
        summaryText: '',
        skipAnimation: false,
      });

      const text1 = 'Abc';
      const text2 = 'Def';
      const text3 = 'Ghi';

      await wrapper.setProps({ summaryText: text1 });
      await wrapper.vm.$nextTick();
      await vi.advanceTimersByTimeAsync(20);

      await wrapper.setProps({ summaryText: text2 });
      await wrapper.vm.$nextTick();
      await vi.advanceTimersByTimeAsync(20);

      await wrapper.setProps({ summaryText: text3 });
      await wrapper.vm.$nextTick();

      await vi.advanceTimersByTimeAsync(50);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.animatedText).toBe(text3);
      expect(wrapper.vm.animatedText).not.toContain(text1);
      expect(wrapper.vm.animatedText).not.toContain(text2);
    });

    it('should prevent animation restart when same text is set while typing', async () => {
      wrapper = createWrapper({
        summaryText: 'Long text for animation',
        skipAnimation: false,
      });

      await wrapper.vm.$nextTick();
      await vi.advanceTimersByTimeAsync(50);

      expect(wrapper.vm.isTyping).toBe(true);
      const animationIdBefore = wrapper.vm.currentAnimationId;
      const textLengthBefore = wrapper.vm.animatedText.length;

      await wrapper.setProps({ summaryText: 'Long text for animation' });
      await vi.advanceTimersByTimeAsync(10);

      expect(wrapper.vm.currentAnimationId).toBe(animationIdBefore);
      expect(wrapper.vm.animatedText.length).toBeGreaterThanOrEqual(
        textLengthBefore,
      );
    });

    it('should properly clean up all timeouts when animation is cancelled', async () => {
      wrapper = createWrapper({
        summaryText: '',
        skipAnimation: false,
      });

      await wrapper.setProps({
        summaryText: 'Text with many characters to create multiple timeouts',
      });

      await vi.advanceTimersByTimeAsync(30);

      expect(wrapper.vm.animationAbortController).toBeTruthy();
      expect(wrapper.vm.isTyping).toBe(true);

      await wrapper.setProps({ summaryText: 'New text' });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.animationAbortController).toBeTruthy();
      expect(wrapper.vm.currentAnimationId).toBeGreaterThan(1);
    });
  });
});
