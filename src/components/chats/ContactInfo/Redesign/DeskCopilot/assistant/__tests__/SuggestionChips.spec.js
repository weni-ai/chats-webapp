import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SuggestionChips from '../SuggestionChips.vue';

const createWrapper = (suggestions = ['Ask about color']) =>
  mount(SuggestionChips, {
    props: { suggestions },
    global: {
      stubs: {
        UnnnicChip: {
          name: 'UnnnicChip',
          props: ['text', 'type', 'isClickable'],
          template:
            '<button data-testid="assistant-suggestion-chip" @click="$emit(\'click\')">{{ text }}</button>',
        },
      },
    },
  });

describe('AssistantSuggestionChips', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('does not render when there are no suggestions', () => {
    wrapper = createWrapper([]);
    expect(
      wrapper.find('[data-testid="assistant-suggestion-chips"]').exists(),
    ).toBe(false);
  });

  it('emits select when a chip is clicked', async () => {
    wrapper = createWrapper(['Ask about color', 'Ask about size']);

    await wrapper
      .findAll('[data-testid="assistant-suggestion-chip"]')[0]
      .trigger('click');

    expect(wrapper.emitted('select')?.[0]).toEqual(['Ask about color']);
  });
});
