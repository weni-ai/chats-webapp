import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import EmptyState from '../EmptyState.vue';

const createWrapper = () =>
  mount(EmptyState, {
    global: {
      mocks: {
        $t: (key) => key,
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

  it('emits open-create-modal when the create button is clicked', async () => {
    await wrapper
      .find('[data-testid="desk-copilot-create-button"]')
      .trigger('click');

    expect(wrapper.emitted('open-create-modal')).toBeTruthy();
  });

  it('emits open-select-modal when the select button is clicked', async () => {
    await wrapper
      .find('[data-testid="desk-copilot-select-button"]')
      .trigger('click');

    expect(wrapper.emitted('open-select-modal')).toBeTruthy();
  });
});
