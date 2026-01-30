import { mount } from '@vue/test-utils';
import { describe, it, expect, afterEach } from 'vitest';

import ChatFeedback from '../ChatFeedback.vue';

const createWrapper = (props = {}) => {
  return mount(ChatFeedback, {
    props: {
      feedback: 'This is a feedback message',
      scheme: 'blue',
      divisor: false,
      clickable: false,
      ...props,
    },
  });
};

describe('ChatFeedback.vue', () => {
  let wrapper;

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('renders the component correctly', () => {
      wrapper = createWrapper();

      expect(wrapper.find('.chat-feedback__container').exists()).toBe(true);
    });

    it('applies divisor class when divisor prop is true', () => {
      wrapper = createWrapper({ divisor: true });

      expect(wrapper.find('.chat-feedback__container').classes()).toContain(
        'divisor',
      );
    });

    it('does not apply divisor class when divisor prop is false', () => {
      wrapper = createWrapper({ divisor: false });

      expect(wrapper.find('.chat-feedback__container').classes()).not.toContain(
        'divisor',
      );
    });
  });

  describe('Feedback Text Treatment', () => {
    it('capitalizes the first letter of the feedback', () => {
      wrapper = createWrapper({ feedback: 'lowercase feedback' });

      expect(wrapper.vm.treatedFeedback).toBe('Lowercase feedback');
    });

    it('trims whitespace from feedback', () => {
      wrapper = createWrapper({ feedback: '  test feedback  ' });

      expect(wrapper.vm.treatedFeedback).toBe('Test feedback');
    });

    it('handles empty feedback gracefully', () => {
      wrapper = createWrapper({ feedback: '' });

      expect(wrapper.vm.treatedFeedback).toBe('');
    });

    it('handles single character feedback', () => {
      wrapper = createWrapper({ feedback: 'a' });

      expect(wrapper.vm.treatedFeedback).toBe('A');
    });
  });

  describe('Click Handling', () => {
    it('calls handleClick method when tag is clicked', () => {
      wrapper = createWrapper({ clickable: true });

      wrapper.vm.handleClick();

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('does not emit click event when clickable is false', () => {
      wrapper = createWrapper({ clickable: false });

      wrapper.vm.handleClick();

      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('emits click event multiple times when called multiple times', () => {
      wrapper = createWrapper({ clickable: true });

      wrapper.vm.handleClick();
      wrapper.vm.handleClick();
      wrapper.vm.handleClick();

      expect(wrapper.emitted('click')).toHaveLength(3);
    });
  });

  describe('Props Validation', () => {
    it('validates scheme prop with valid values', () => {
      const validator = ChatFeedback.props.scheme.validator;

      expect(validator('blue')).toBe(true);
      expect(validator('purple')).toBe(true);
      expect(validator('red')).toBe(true);
      expect(validator('green')).toBe(true);
      expect(validator('yellow')).toBe(true);
      expect(validator('gray')).toBe(true);
    });

    it('validates scheme prop with invalid values', () => {
      const validator = ChatFeedback.props.scheme.validator;

      expect(validator('invalid')).toBe(false);
      expect(validator('white')).toBe(false);
      expect(validator('black')).toBe(false);
    });

    it('has correct default values for props', () => {
      wrapper = createWrapper({
        feedback: 'test',
      });

      expect(wrapper.props('scheme')).toBe('blue');
      expect(wrapper.props('divisor')).toBe(false);
      expect(wrapper.props('clickable')).toBe(false);
    });
  });
});
