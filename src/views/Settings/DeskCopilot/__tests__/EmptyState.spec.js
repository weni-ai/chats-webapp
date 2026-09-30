import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import EmptyState from '../EmptyState.vue';

const createWrapper = (props = {}) =>
  mount(EmptyState, {
    props,
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicToolTip: {
          template: '<div><slot /></div>',
          props: ['enabled', 'text', 'side'],
        },
        UnnnicButton: {
          template:
            '<button :disabled="disabled" @click="$emit(\'click\')"><slot />{{ text }}</button>',
          props: ['type', 'size', 'text', 'disabled'],
        },
      },
    },
  });

describe('DeskCopilot EmptyState', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('renders the empty state copy', () => {
    expect(
      wrapper.find('[data-testid="desk-copilot-empty-state"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-empty-state-title"]').text(),
    ).toBe('config_chats.desk_copilot.empty_state.title');
  });

  it('does not render the select project button', () => {
    expect(
      wrapper.find('[data-testid="desk-copilot-select-button"]').exists(),
    ).toBe(false);
  });

  it('emits open-create-modal when the create button is clicked', async () => {
    await wrapper
      .find('[data-testid="desk-copilot-create-button"]')
      .trigger('click');

    expect(wrapper.emitted('open-create-modal')).toBeTruthy();
  });

  it('does not emit open-create-modal when create is disabled', async () => {
    wrapper = createWrapper({ isCreateDisabled: true });

    await wrapper
      .find('[data-testid="desk-copilot-create-button"]')
      .trigger('click');

    expect(wrapper.emitted('open-create-modal')).toBeFalsy();
    expect(
      wrapper
        .find('[data-testid="desk-copilot-create-button"]')
        .attributes('disabled'),
    ).toBeDefined();
  });
});
