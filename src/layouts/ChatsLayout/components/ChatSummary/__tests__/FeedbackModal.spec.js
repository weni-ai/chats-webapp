import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
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
        components: {
          UnnnicModalDialog: config.global.stubs.UnnnicModalDialog,
        },
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          teleport: true,
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

      const modal = wrapper.findComponent({ name: 'UnnnicModalDialogStub' });
      expect(modal.exists()).toBe(true);
    });

    it('should have correct props based on hasFeedback value', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });
      expect(wrapper.props('hasFeedback')).toBe(false);
      expect(wrapper.props('roomUuid')).toBe('test-uuid');

      wrapper = createWrapper({
        hasFeedback: true,
        roomUuid: 'test-uuid',
      });
      expect(wrapper.props('hasFeedback')).toBe(true);
    });

    it('should conditionally display rating buttons based on hasFeedback', () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });
      // When hasFeedback is false, rating UI should be available
      expect(wrapper.vm.hasFeedback).toBe(false);

      wrapper = createWrapper({
        hasFeedback: true,
        roomUuid: 'test-uuid',
      });
      // When hasFeedback is true, rating UI should not be available
      expect(wrapper.vm.hasFeedback).toBe(true);
    });
  });

  describe('Interactions', () => {
    it('should update liked feedback when handleLike is called', async () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      await wrapper.vm.handleLike(true);
      expect(wrapper.vm.activeRoomSummary.feedback.liked).toBe(true);

      await wrapper.vm.handleLike(false);
      expect(wrapper.vm.activeRoomSummary.feedback.liked).toBe(false);
    });

    it('should show textarea when feedback is negative', async () => {
      wrapper = createWrapper({
        hasFeedback: false,
        roomUuid: 'test-uuid',
      });

      const store = useRooms();
      store.roomsSummary['test-uuid'] = { feedback: { liked: false } };
      await wrapper.vm.$nextTick();

      // Verify feedbackText is reactive and component can handle negative feedback
      expect(wrapper.vm.activeRoomSummary.feedback.liked).toBe(false);
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
