// tests for ChatMessagesFeedbackMessage component
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ChatMessagesFeedbackMessage from '../ChatMessagesFeedbackMessage.vue';
import i18n from '@/plugins/i18n.js';

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
    let previousLocale;

    beforeAll(() => {
      previousLocale = i18n.global.locale;
      i18n.global.locale = 'pt-br';
    });

    afterAll(() => {
      i18n.global.locale = previousLocale;
    });

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

    it('should render the standard transfer message when requested_by is the same user as from', () => {
      const content = {
        action: 'transfer',
        from: { type: 'user', name: 'Eduardo', id: '7' },
        to: { type: 'user', name: 'Marcus', id: '10' },
        requested_by: { type: 'user', name: 'Eduardo', id: '7' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBe('Eduardo transferiu o chat para Marcus');
    });

    it('should render the "by other" transfer message when requested_by differs from "from"', () => {
      const content = {
        action: 'transfer',
        from: { type: 'user', name: 'Renata', id: '5' },
        to: { type: 'user', name: 'Julia', id: '10' },
        requested_by: { type: 'user', name: 'Leonardo', id: '7' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBe('Leonardo transferiu o chat de Renata para Julia');
    });

    it('should render the standard transfer message when requested_by is missing', () => {
      const content = {
        action: 'transfer',
        from: { type: 'user', name: 'Agent1', id: '1' },
        to: { type: 'user', name: 'Agent2', id: '2' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBe('Agent1 transferiu o chat para Agent2');
    });

    it('should render the standard transfer message when requested_by is not a user', () => {
      const content = {
        action: 'transfer',
        from: { type: 'user', name: 'Agent1', id: '1' },
        to: { type: 'user', name: 'Agent2', id: '2' },
        requested_by: { type: 'queue', name: 'Support', id: '99' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBe('Agent1 transferiu o chat para Agent2');
    });

    it('should compare ids as strings (number vs string)', () => {
      const content = {
        action: 'transfer',
        from: { type: 'user', name: 'Agent1', id: 7 },
        to: { type: 'user', name: 'Agent2', id: 10 },
        requested_by: { type: 'user', name: 'Agent1', id: '7' },
      };
      const message = { text: JSON.stringify({ method: 'rt', content }) };
      const wrapper = createWrapper({ message });
      const result = wrapper.vm.createFeedbackLabel(message);

      expect(result).toBe('Agent1 transferiu o chat para Agent2');
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
