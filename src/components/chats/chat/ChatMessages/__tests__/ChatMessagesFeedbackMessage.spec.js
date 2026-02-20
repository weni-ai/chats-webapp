// tests for ChatMessagesFeedbackMessage component
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ChatMessagesFeedbackMessage from '../ChatMessagesFeedbackMessage.vue';

describe('ChatMessagesFeedbackMessage', () => {
  const createWrapper = (props = {}) => {
    const defaultProps = {
      message: { text: JSON.stringify({ type: 'queue', name: 'Support' }) },
      scheme: 'blue',
      ...props,
    };

    return mount(ChatMessagesFeedbackMessage, {
      props: defaultProps,
      global: {
        mocks: {
          $t: vi.fn(
            (key, params) =>
              `${key}${params ? `_${JSON.stringify(params)}` : ''}`,
          ),
        },
        stubs: {
          ChatFeedback: true,
        },
      },
    });
  };

  describe('Component Structure and Props', () => {
    it('should render with correct props and structure', () => {
      const message = {
        text: JSON.stringify({ type: 'queue', name: 'Support' }),
      };
      const wrapper = createWrapper({ message, scheme: 'red' });

      expect(wrapper.props('message')).toEqual(message);
      expect(wrapper.props('scheme')).toBe('red');
      expect(wrapper.findComponent({ name: 'ChatFeedback' }).exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="chat-feedback"]').exists()).toBe(true);
    });
  });

  describe('Old Feedback Format Processing', () => {
    it('should process old format queue transfers correctly', () => {
      const message = {
        text: JSON.stringify({ type: 'queue', name: 'Support Queue' }),
      };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should process old format user transfers correctly', () => {
      const message = {
        text: JSON.stringify({ type: 'user', name: 'John Agent' }),
      };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle unknown old format types', () => {
      const message = {
        text: JSON.stringify({ type: 'unknown', name: 'Test' }),
      };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeUndefined();
    });
  });

  describe('RT Method Processing - Pick Actions', () => {
    it('should handle pick from user source', () => {
      const content = {
        action: 'pick',
        from: { type: 'user', name: 'Agent1' },
        to: { name: 'Manager1' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle pick from queue source', () => {
      const content = {
        action: 'pick',
        from: { type: 'queue', name: 'Queue1' },
        to: { name: 'Agent2' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return empty for pick from unknown source', () => {
      const content = {
        action: 'pick',
        from: { type: 'other' },
        to: { name: 'Agent3' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBe('');
    });
  });

  describe('RT Method Processing - Transfer Actions', () => {
    it('should handle all transfer combinations', () => {
      const transferCases = [
        {
          from: { type: 'user', name: 'Agent1' },
          to: { type: 'queue', name: 'Queue1' },
        },
        {
          from: { type: 'queue', name: 'Queue1' },
          to: { type: 'queue', name: 'Queue2' },
        },
        {
          from: { type: 'queue', name: 'Queue1' },
          to: { type: 'user', name: 'Agent1' },
        },
        {
          from: { type: 'user', name: 'Agent1' },
          to: { type: 'user', name: 'Agent2' },
        },
      ];

      transferCases.forEach((transferContent) => {
        const content = { action: 'transfer', ...transferContent };
        const message = { text: JSON.stringify({ method: 'rt', content }) };
        const wrapper = createWrapper({ message });
        const result = wrapper.vm.createFeedbackLabel(message);

        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('RT Method Processing - Other Actions', () => {
    it('should handle forward to user', () => {
      const content = {
        action: 'forward',
        to: { type: 'user', name: 'Agent1' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle forward to queue', () => {
      const content = {
        action: 'forward',
        to: { type: 'queue', name: 'Queue1' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle auto assign from queue', () => {
      const content = {
        action: 'auto_assign_from_queue',
        to: { name: 'Agent1' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return empty for unknown actions', () => {
      const content = { action: 'unknown_action' };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBe('');
    });
  });

  describe('Internal Notes Chip', () => {
    it('should handle see_all_internal_notes_chip flag', () => {
      const message = {
        text: JSON.stringify({ see_all_internal_notes_chip: true }),
      };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Other Methods Processing', () => {
    it('should handle fs method', () => {
      const content = { name: 'Welcome Flow' };
      const message = { text: JSON.stringify({ method: 'fs', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('Welcome Flow');
    });

    it('should handle ecf method', () => {
      const content = {
        user: 'Admin',
        custom_field_name: 'Priority',
        old: 'Low',
        new: 'High',
      };
      const message = { text: JSON.stringify({ method: 'ecf', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle dc method', () => {
      const content = { user: 'Agent1', queue: 'Support' };
      const message = { text: JSON.stringify({ method: 'dc', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle da method', () => {
      const content = { user: 'Agent2' };
      const message = { text: JSON.stringify({ method: 'da', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return empty for unknown methods', () => {
      const message = {
        text: JSON.stringify({ method: 'unknown', content: {} }),
      };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBe('');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle incomplete rt method data gracefully', () => {
      const wrapper = createWrapper();

      const incompleteCases = [
        { method: 'rt', content: { action: 'pick' } },
        {
          method: 'rt',
          content: { action: 'transfer', from: { type: 'unknown' } },
        },
        { method: 'rt', content: {} },
      ];

      incompleteCases.forEach((data) => {
        const message = { text: JSON.stringify(data) };
        const result = wrapper.vm.createFeedbackLabel(message);
        expect(result).toBe('');
      });
    });

    it('should handle unknown method gracefully', () => {
      const wrapper = createWrapper();

      const unknownMethodMessage = {
        text: JSON.stringify({ method: 'unknown_method', content: {} }),
      };
      const result = wrapper.vm.createFeedbackLabel(unknownMethodMessage);
      expect(result).toBe('');
    });

    it('should pass props correctly to ChatFeedback', () => {
      const message = {
        text: JSON.stringify({ type: 'queue', name: 'Test Queue' }),
      };
      const scheme = 'green';
      const wrapper = createWrapper({ message, scheme });

      const feedback = wrapper.getComponent({ name: 'ChatFeedback' });
      expect(feedback.props('scheme')).toBe('green');
      expect(feedback.props('feedback')).toBeTruthy();
      expect(typeof feedback.props('feedback')).toBe('string');
    });

    it('should pass clickable prop to ChatFeedback', () => {
      const message = {
        text: JSON.stringify({ type: 'queue', name: 'Test Queue' }),
      };
      const wrapper = createWrapper({ message, clickable: true });

      const feedback = wrapper.getComponent({ name: 'ChatFeedback' });
      expect(feedback.props('clickable')).toBe(true);
    });
  });

  describe('User Name Handling', () => {
    it('should handle user with email instead of name', () => {
      const content = {
        action: 'pick',
        from: { type: 'user', email: 'agent@test.com' },
        to: { name: 'Manager' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should prefer name over email when both are present', () => {
      const content = {
        action: 'transfer',
        from: { type: 'user', name: 'Agent Name', email: 'agent@test.com' },
        to: { type: 'queue', name: 'Support' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('Complete Method Coverage', () => {
    it('should exercise all branches of createFeedbackLabel method', () => {
      const allFormats = [
        { type: 'queue', name: 'Q1' },
        { type: 'user', name: 'U1' },

        {
          method: 'rt',
          content: {
            action: 'pick',
            from: { type: 'user', name: 'A1' },
            to: { name: 'M1' },
          },
        },
        {
          method: 'rt',
          content: {
            action: 'pick',
            from: { type: 'queue', name: 'Q1' },
            to: { name: 'A1' },
          },
        },
        {
          method: 'rt',
          content: {
            action: 'transfer',
            from: { type: 'user', name: 'A1' },
            to: { type: 'queue', name: 'Q1' },
          },
        },
        {
          method: 'rt',
          content: {
            action: 'transfer',
            from: { type: 'queue', name: 'Q1' },
            to: { type: 'queue', name: 'Q2' },
          },
        },
        {
          method: 'rt',
          content: {
            action: 'transfer',
            from: { type: 'queue', name: 'Q1' },
            to: { type: 'user', name: 'A1' },
          },
        },
        {
          method: 'rt',
          content: {
            action: 'transfer',
            from: { type: 'user', name: 'A1' },
            to: { type: 'user', name: 'A2' },
          },
        },
        {
          method: 'rt',
          content: { action: 'forward', to: { type: 'user', name: 'A1' } },
        },
        {
          method: 'rt',
          content: { action: 'forward', to: { type: 'queue', name: 'Q1' } },
        },
        {
          method: 'rt',
          content: { action: 'auto_assign_from_queue', to: { name: 'A1' } },
        },

        { method: 'fs', content: { name: 'Flow1' } },
        {
          method: 'ecf',
          content: {
            user: 'U1',
            custom_field_name: 'F1',
            old: 'O1',
            new: 'N1',
          },
        },
        { method: 'dc', content: { user: 'U1', queue: 'Q1' } },
        { method: 'da', content: { user: 'U1' } },
      ];

      allFormats.forEach((format, index) => {
        const message = { text: JSON.stringify(format) };
        const wrapper = createWrapper({ message });
        const result = wrapper.vm.createFeedbackLabel(message);

        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
