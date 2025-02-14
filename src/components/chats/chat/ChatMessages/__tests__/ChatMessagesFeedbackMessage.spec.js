// tests for ChatMessagesFeedbackMessage component
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChatMessagesFeedbackMessage from '../ChatMessagesFeedbackMessage.vue';

const mountComponent = (props) => {
  return mount(ChatMessagesFeedbackMessage, {
    props,
    global: {
      mocks: {
        $t: (msg, params) =>
          params ? `${msg} ${JSON.stringify(params)}` : msg,
      },
    },
  });
};

describe('ChatMessagesFeedbackMessage', () => {
  it('renders ChatFeedback with the correct label for old feedback queue', () => {
    const message = {
      text: JSON.stringify({ type: 'queue', name: 'Support' }),
    };
    const wrapper = mountComponent({ message });
    console.log(wrapper.html());
    expect(
      wrapper.findComponent({ name: 'ChatFeedback' }).props('feedback'),
    ).toContain(wrapper.vm.$t('contact_transferred_to_queue'));
  });
});
