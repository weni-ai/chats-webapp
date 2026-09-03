import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import HumanMessage from '../HumanMessage.vue';

vi.mock('@/plugins/i18n', () => ({
  default: {
    global: {
      t: (key) => key,
    },
  },
}));

const createWrapper = (props = {}) =>
  mount(HumanMessage, {
    props: {
      text: 'Hello',
      ...props,
    },
    global: {
      stubs: {
        AudioMessage: true,
        ImageMessage: true,
        FileMessage: true,
      },
    },
  });

describe('AssistantHumanMessage', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders the message text', () => {
    wrapper = createWrapper({ text: 'Suggested reply' });

    expect(
      wrapper.find('[data-testid="assistant-human-message-text"]').text(),
    ).toBe('Suggested reply');
  });

  it('renders the place order label for order messages', () => {
    wrapper = createWrapper({
      text: '',
      type: 'order',
    });

    expect(
      wrapper.find('[data-testid="assistant-human-message-text"]').text(),
    ).toBe('contact_info.desk_copilot.assistant.cart.place_order_action');
  });
});
