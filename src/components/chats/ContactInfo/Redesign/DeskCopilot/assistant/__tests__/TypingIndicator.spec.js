import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TypingIndicator from '../TypingIndicator.vue';

describe('AssistantTypingIndicator', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders the typing dots', () => {
    wrapper = mount(TypingIndicator);

    expect(
      wrapper.find('[data-testid="assistant-typing-indicator"]').exists(),
    ).toBe(true);
    expect(wrapper.findAll('.typing-indicator__dot')).toHaveLength(3);
  });
});
