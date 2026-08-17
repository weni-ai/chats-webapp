import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

import InfoCard from '../InfoCard.vue';
import env from '@/utils/env';

vi.mock('@/utils/env', () => ({
  default: vi.fn(),
}));

const createWrapper = () =>
  mount(InfoCard, {
    global: {
      mocks: {
        $t: (key) => key,
      },
    },
  });

describe('DeskCopilot InfoCard', () => {
  let wrapper;
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
    env.mockReturnValue('https://docs.weni.ai/desk-copilot');
    wrapper = createWrapper();
  });

  afterEach(() => {
    window.open = originalOpen;
    wrapper?.unmount();
  });

  it('renders the info card', () => {
    expect(
      wrapper.find('[data-testid="desk-copilot-info-card"]').exists(),
    ).toBe(true);
  });

  it('opens the learn more URL in a new tab', async () => {
    await wrapper
      .find('[data-testid="desk-copilot-learn-more"]')
      .trigger('click');

    expect(window.open).toHaveBeenCalledWith(
      'https://docs.weni.ai/desk-copilot',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
