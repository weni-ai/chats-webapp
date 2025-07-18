import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import FeedbackModal from '../FeedbackModal.vue';
import { useRooms } from '@/store/modules/chats/rooms';

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    sendSummaryFeedback: vi.fn(),
  },
}));

describe('FeedbackModal', () => {
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
                },
                activeRoomSummary: {
                  feedback: { liked: null },
                },
                roomsSummary: {},
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

    return mount(FeedbackModal, { ...defaultOptions, ...options });
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
    it('should render the modal correctly', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(
        true,
      );
    });

    it('should display correct text when hasFeedback is false', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });
      const text = wrapper.find('[data-testid="feedback-text"]');
      expect(text.text()).toBe(
        wrapper.vm.$t('chats.summary.feedback.empty_rating'),
      );
    });

    it('should display correct text when hasFeedback is true', () => {
      wrapper = createWrapper({
        hasFeedback: true,
        roomUuid: 'test-uuid',
      });

      const text = wrapper.find('[data-testid="feedback-text"]');
      expect(text.text()).toBe(
        wrapper.vm.$t('chats.summary.feedback.needs_improvement_text'),
      );
    });

    it('should display rating buttons when hasFeedback is false', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      const likeButton = wrapper.find('[data-testid="feedback-like"]');
      const dislikeButton = wrapper.find('[data-testid="feedback-dislike"]');

      expect(likeButton.exists()).toBe(true);
      expect(dislikeButton.exists()).toBe(true);
    });

    it('should not display rating buttons when hasFeedback is true', () => {
      wrapper = createWrapper({
        hasFeedback: true,
        roomUuid: 'test-uuid',
      });

      const likeButton = wrapper.find('[data-testid="feedback-like"]');
      const dislikeButton = wrapper.find('[data-testid="feedback-dislike"]');

      expect(likeButton.exists()).toBe(false);
      expect(dislikeButton.exists()).toBe(false);
    });
  });

  describe('Interactions', () => {
    it('should call handleLike when like button is clicked', async () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      const likeButton = wrapper.find('[data-testid="feedback-like"]');
      await likeButton.trigger('click');

      expect(wrapper.vm.activeRoomSummary.feedback.liked).toBe(true);
    });

    it('should call handleLike when dislike button is clicked', async () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      const dislikeButton = wrapper.find('[data-testid="feedback-dislike"]');
      await dislikeButton.trigger('click');

      expect(wrapper.vm.activeRoomSummary.feedback.liked).toBe(false);
    });

    it('should display textarea when feedback is negative', async () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      const store = useRooms();
      store.roomsSummary['test-uuid'] = { feedback: { liked: false } };
      await wrapper.vm.$nextTick();

      const textarea = wrapper.find('[data-testid="feedback-textarea"]');
      expect(textarea.exists()).toBe(true);
    });

    it('should not display textarea when feedback is positive', async () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      const store = useRooms();
      store.roomsSummary['test-uuid'] = { feedback: { liked: true } };
      await wrapper.vm.$nextTick();

      const textarea = wrapper.find('[data-testid="feedback-textarea"]');
      expect(textarea.exists()).toBe(false);
    });
  });

  describe('Methods', () => {
    it('should restore initial feedback when handleCancel is called', async () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      wrapper.vm.activeRoomSummary.feedback.liked = true;

      await wrapper.vm.handleCancel();

      expect(wrapper.vm.roomsSummary['test-uuid'].feedback.liked).toBe(null);
    });

    it('should emit close with closeSummary when handleSubmit is called and hasFeedback is false', async () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      wrapper.vm.activeRoomSummary.feedback.liked = true;

      await wrapper.vm.handleSubmit();

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')[0][0]).toEqual({ closeSummary: true });
    });

    it('should emit close without closeSummary when handleSubmit is called and hasFeedback is true', async () => {
      wrapper = createWrapper({
        hasFeedback: true,
        roomUuid: 'test-uuid',
      });

      wrapper.vm.activeRoomSummary.feedback.liked = true;

      await wrapper.vm.handleSubmit();

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')[0][0]).toEqual({ closeSummary: false });
    });

    it('should handle error in handleSubmit', async () => {
      const { default: Room } = await import(
        '@/services/api/resources/chats/room'
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      Room.sendSummaryFeedback.mockRejectedValue(new Error('Test error'));

      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      wrapper.vm.activeRoomSummary.feedback.liked = true;

      await wrapper.vm.handleSubmit();

      expect(consoleSpy).toHaveBeenCalled();
      expect(wrapper.vm.isLoading).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('Initial State', () => {
    it('should initialize with empty feedbackText', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      expect(wrapper.vm.feedbackText).toBe('');
    });

    it('should initialize with isLoading false', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should save initial feedback on mounted', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      expect(wrapper.vm.initialFeedback).toBeDefined();
    });
  });

  describe('Props', () => {
    it('should accept hasFeedback as prop', () => {
      wrapper = createWrapper({
        hasFeedback: true,
        roomUuid: 'test-uuid',
      });

      expect(wrapper.props('hasFeedback')).toBe(true);
    });

    it('should accept roomUuid as required prop', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      expect(wrapper.props('roomUuid')).toBe('test-uuid');
    });
  });
});
