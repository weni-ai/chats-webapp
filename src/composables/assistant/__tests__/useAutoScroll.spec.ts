import { describe, it, expect, afterEach, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { useAutoScroll } from '../useAutoScroll';

const TestHost = defineComponent({
  setup() {
    const messages = ref<{ id: string }[]>([]);
    const isThinking = ref(false);
    const isTyping = ref(false);
    const {
      listRef,
      bottomAnchorRef,
      showGoToBottom,
      scrollToBottom,
      scrollToBottomIfNear,
    } = useAutoScroll(messages, isThinking, isTyping);

    return {
      messages,
      isThinking,
      isTyping,
      listRef,
      bottomAnchorRef,
      showGoToBottom,
      scrollToBottom,
      scrollToBottomIfNear,
    };
  },
  template: `
    <div
      ref="listRef"
      data-testid="list"
      style="height: 80px; overflow: auto;"
    >
      <div data-testid="content" style="height: 400px" />
      <div ref="bottomAnchorRef" data-testid="anchor" />
    </div>
  `,
});

describe('useAutoScroll', () => {
  let wrapper;
  let scrollIntoView;

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  function mountHost() {
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    wrapper = mount(TestHost);
    return wrapper;
  }

  function mockListMetrics({
    scrollHeight = 400,
    clientHeight = 80,
    scrollTop = 0,
  } = {}) {
    const list = wrapper.find('[data-testid="list"]').element;
    Object.defineProperty(list, 'scrollHeight', {
      value: scrollHeight,
      configurable: true,
    });
    Object.defineProperty(list, 'clientHeight', {
      value: clientHeight,
      configurable: true,
    });
    Object.defineProperty(list, 'scrollTop', {
      value: scrollTop,
      configurable: true,
    });
    return list;
  }

  it('scrolls to the bottom when messages change while near the end', async () => {
    mountHost();
    await nextTick();
    scrollIntoView.mockClear();

    wrapper.vm.messages.push({ id: '1' });
    await nextTick();
    await nextTick();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('scrolls to the bottom when thinking starts while near the end', async () => {
    mountHost();
    await nextTick();
    scrollIntoView.mockClear();

    wrapper.vm.isThinking = true;
    await nextTick();
    await nextTick();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('scrolls to the bottom when typing starts while near the end', async () => {
    mountHost();
    await nextTick();
    scrollIntoView.mockClear();

    wrapper.vm.isTyping = true;
    await nextTick();
    await nextTick();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('does not auto-scroll when the user has scrolled away from the end', async () => {
    mountHost();
    await nextTick();

    wrapper.vm.messages.push({ id: '1' });
    await nextTick();
    await nextTick();

    const list = mockListMetrics({ scrollTop: 0 });
    list.dispatchEvent(new Event('scroll'));
    await nextTick();
    scrollIntoView.mockClear();

    wrapper.vm.messages.push({ id: '2' });
    await nextTick();
    await nextTick();

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(wrapper.vm.showGoToBottom).toBe(true);
  });

  it('shows the go-to-bottom control when the user scrolls away from the end', async () => {
    mountHost();
    wrapper.vm.messages.push({ id: '1' });
    await nextTick();

    const list = mockListMetrics({ scrollTop: 0 });
    list.dispatchEvent(new Event('scroll'));
    await nextTick();

    expect(wrapper.vm.showGoToBottom).toBe(true);
  });
});
