import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ThinkingIndicator from '../ThinkingIndicator.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key.split('.').pop(),
  }),
}));

const createWrapper = () =>
  mount(ThinkingIndicator, {
    global: {
      stubs: {
        UnnnicIcon: true,
      },
    },
  });

describe('AssistantThinkingIndicator', () => {
  let wrapper;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the first thinking message after the initial delay', async () => {
    wrapper = createWrapper();

    vi.advanceTimersByTime(500);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="assistant-thinking-text"]').text()).toBe(
      'processing',
    );
  });

  it('rotates to the next thinking message after the delay', async () => {
    wrapper = createWrapper();

    vi.advanceTimersByTime(500);
    await wrapper.vm.$nextTick();

    vi.advanceTimersByTime(4000);
    await wrapper.vm.$nextTick();
    vi.advanceTimersByTime(500);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="assistant-thinking-text"]').text()).toBe(
      'connecting',
    );
  });
});
