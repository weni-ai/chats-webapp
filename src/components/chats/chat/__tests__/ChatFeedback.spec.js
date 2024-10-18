import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

import ChatFeedback from '../ChatFeedback.vue';

const createWrapper = () => {
  return mount(ChatFeedback, {
    props: {
      feedback: 'This is a feedback message',
      scheme: 'blue',
      divisor: false,
    },
  });
};

describe('ChatFeedback.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('renders the feedback message correctly', () => {
    const feedbackElement = wrapper.find('[data-testid="chat-feedback"]');
    expect(feedbackElement.exists()).toBe(true);
    expect(feedbackElement.html()).toContain('This is a feedback message');
  });

  it('not applies scheme color', async () => {
    await wrapper.setProps({ scheme: '' });
    expect(wrapper.classes()).not.toContain(/chat-feedback--/gi);
  });

  it('applies the correct color scheme class', async () => {
    expect(wrapper.find('.chat-feedback--blue').exists()).toBe(true);

    await wrapper.setProps({ scheme: 'purple' });

    expect(wrapper.find('.chat-feedback--purple').exists()).toBe(true);
    expect(wrapper.find('.chat-feedback--blue').exists()).toBe(false);
  });

  it('capitalizes the first letter of the feedback', async () => {
    await wrapper.setProps({ feedback: 'lowercase feedback' });
    const feedbackElement = wrapper.find('[data-testid="chat-feedback"]');
    expect(feedbackElement.html()).toContain('Lowercase feedback');
  });
});
