import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AiMessage from '../AiMessage.vue';

vi.mock('@weni/unnnic-system', () => ({
  UnnnicCallAlert: vi.fn(),
}));

const createWrapper = (props = {}) =>
  mount(AiMessage, {
    props: {
      text: 'Intro text',
      suggestion: 'Suggested reply for the customer',
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicIcon: true,
        UnnnicButton: {
          name: 'UnnnicButton',
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
        UnnnicToolTip: {
          name: 'UnnnicToolTip',
          template: '<div><slot /></div>',
        },
      },
    },
  });

describe('AssistantAiMessage', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('renders leading text and suggestion when suggestion is provided', () => {
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="assistant-ai-leading"]').text()).toBe(
      'Intro text',
    );
    expect(
      wrapper.find('[data-testid="assistant-ai-suggestion"]').text(),
    ).toContain('Suggested reply for the customer');
  });

  it('uses text as suggestion when metadata suggestion is missing', () => {
    wrapper = createWrapper({
      text: 'Only text reply',
      suggestion: undefined,
    });

    expect(wrapper.find('[data-testid="assistant-ai-leading"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.find('[data-testid="assistant-ai-suggestion"]').text(),
    ).toContain('Only text reply');
  });

  it('emits send with the suggestion text', async () => {
    wrapper = createWrapper();

    await wrapper.find('[data-testid="assistant-ai-send"]').trigger('click');

    expect(wrapper.emitted('send')?.[0]).toEqual([
      'Suggested reply for the customer',
    ]);
  });

  it('shows a caret inside the suggestion box and hides actions while streaming', () => {
    wrapper = createWrapper({
      text: 'Hello world',
      suggestion: undefined,
      status: 'streaming',
    });

    const suggestion = wrapper.find('[data-testid="assistant-ai-suggestion"]');

    expect(suggestion.exists()).toBe(true);
    expect(suggestion.classes()).not.toContain(
      'ai-message__suggestion--streaming',
    );
    expect(wrapper.find('[data-testid="assistant-ai-caret"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="assistant-ai-actions"]').exists()).toBe(
      false,
    );
  });
});
