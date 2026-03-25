import { flushPromises, mount, config } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { nextTick } from 'vue';

import ModalFeedback from '../ModalFeedback.vue';
import feedbackService from '@/services/api/resources/chats/feedback';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/feedback', () => ({
  default: {
    createFeedback: vi.fn(),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const createWrapper = (props = {}) => {
  return mount(ModalFeedback, {
    props: {
      modelValue: true,
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
    },
  });
};

describe('ModalFeedback.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();
  });

  describe('Component Initialization', () => {
    it('should render with correct initial state', () => {
      expect(wrapper.vm.selectedFeedback).toBeNull();
      expect(wrapper.vm.feedbackDescription).toBe('');
      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should have correct feedback options', () => {
      expect(wrapper.vm.feedbackOptions).toHaveLength(3);
      expect(wrapper.vm.feedbackOptions[0]).toEqual({
        label: 'feedback_modal.feedback_options.negative',
        icon: 'sentiment_dissatisfied',
        value: 1,
      });
      expect(wrapper.vm.feedbackOptions[1]).toEqual({
        label: 'feedback_modal.feedback_options.neutral',
        icon: 'sentiment_neutral',
        value: 2,
      });
      expect(wrapper.vm.feedbackOptions[2]).toEqual({
        label: 'feedback_modal.feedback_options.positive',
        icon: 'sentiment_satisfied',
        value: 3,
      });
    });

    it('should render modal component', () => {
      expect(wrapper.findComponent({ name: 'ModalFeedback' }).exists()).toBe(
        true,
      );
    });
  });

  describe('Feedback Selection', () => {
    it.each([
      [1, 'negative'],
      [2, 'neutral'],
      [3, 'positive'],
    ])('should select feedback option %i', async (value) => {
      wrapper.vm.selectedFeedback = value;
      await nextTick();

      expect(wrapper.vm.selectedFeedback).toBe(value);
      expect(wrapper.vm.isSelected).toBe(true);
    });

    it('should update isSelected computed when feedback is selected', async () => {
      expect(wrapper.vm.isSelected).toBe(false);

      wrapper.vm.selectedFeedback = 1;
      await nextTick();

      expect(wrapper.vm.isSelected).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should return correct feedbackDescriptionLabel for negative feedback', async () => {
      wrapper.vm.selectedFeedback = 'negative';
      await nextTick();

      expect(wrapper.vm.feedbackDescriptionLabel).toBe(
        'feedback_modal.problem_question',
      );
    });

    it('should return correct feedbackDescriptionLabel for neutral feedback', async () => {
      wrapper.vm.selectedFeedback = 'neutral';
      await nextTick();

      expect(wrapper.vm.feedbackDescriptionLabel).toBe(
        'feedback_modal.problem_question',
      );
    });

    it('should return correct feedbackDescriptionLabel for positive feedback', async () => {
      wrapper.vm.selectedFeedback = 3;
      await nextTick();

      expect(wrapper.vm.feedbackDescriptionLabel).toBe(
        'feedback_modal.improvement_question',
      );
    });

    it('should return false for isSelected when no feedback is selected', () => {
      expect(wrapper.vm.isSelected).toBe(false);
    });

    it('should return true for isSelected when feedback is selected', async () => {
      wrapper.vm.selectedFeedback = 1;
      await nextTick();

      expect(wrapper.vm.isSelected).toBe(true);
    });
  });

  describe('Modal Events', () => {
    it('should emit update:modelValue when closeModal is called', () => {
      wrapper.vm.closeModal();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
    });

    it('should call closeModal method', () => {
      const closeModalSpy = vi.spyOn(wrapper.vm, 'closeModal');
      wrapper.vm.closeModal();

      expect(closeModalSpy).toHaveBeenCalled();
    });
  });

  describe('Feedback Submission', () => {
    beforeEach(() => {
      wrapper.vm.selectedFeedback = 1;
      wrapper.vm.feedbackDescription = 'Test feedback';
    });

    it('should submit feedback successfully', async () => {
      feedbackService.createFeedback.mockResolvedValue();

      await wrapper.vm.submitFeedback();
      await flushPromises();

      expect(feedbackService.createFeedback).toHaveBeenCalledWith({
        rating: 1,
        comment: 'Test feedback',
      });
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('should handle submission errors', async () => {
      const error = new Error('API Error');
      feedbackService.createFeedback.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await wrapper.vm.submitFeedback();
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error submitting feedback',
        error,
      );
      expect(callUnnnicAlert).toHaveBeenCalledWith({
        props: {
          text: 'An error occurred while submitting feedback, please try again later!',
          type: 'error',
        },
        seconds: 5,
      });

      consoleSpy.mockRestore();
    });

    it('should manage loading state during submission', async () => {
      let resolvePromise;
      feedbackService.createFeedback.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );

      const submitPromise = wrapper.vm.submitFeedback();
      await nextTick();

      expect(wrapper.vm.isLoading).toBe(true);

      resolvePromise();
      await submitPromise;
      await flushPromises();

      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should reset loading state on error', async () => {
      feedbackService.createFeedback.mockRejectedValue(new Error('Test error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await wrapper.vm.submitFeedback();
      await flushPromises();

      expect(wrapper.vm.isLoading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty feedback description', async () => {
      wrapper.vm.selectedFeedback = 1;
      wrapper.vm.feedbackDescription = '';

      feedbackService.createFeedback.mockResolvedValue();

      await wrapper.vm.submitFeedback();
      await flushPromises();

      expect(feedbackService.createFeedback).toHaveBeenCalledWith({
        rating: 1,
        comment: '',
      });
    });

    it('should handle modelValue prop changes', async () => {
      await wrapper.setProps({ modelValue: false });
      expect(wrapper.props('modelValue')).toBe(false);
    });

    it('should handle null selectedFeedback', () => {
      wrapper.vm.selectedFeedback = null;
      expect(wrapper.vm.isSelected).toBe(false);
    });
  });
});
