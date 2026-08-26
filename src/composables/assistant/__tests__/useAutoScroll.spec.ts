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

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  function mountHost() {
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
      writable: true,
      configurable: true,
    });
    return list;
  }

  it('scrolls the list container when messages change while near the end', async () => {
    mountHost();
    await nextTick();

    const list = mockListMetrics({ scrollTop: 300 });
    wrapper.vm.messages.push({ id: '1' });
    await nextTick();
    await nextTick();

    expect(list.scrollTop).toBe(400);
  });

  it('scrolls the list container when thinking starts while near the end', async () => {
    mountHost();
    await nextTick();

    const list = mockListMetrics({ scrollTop: 300 });
    wrapper.vm.isThinking = true;
    await nextTick();
    await nextTick();

    expect(list.scrollTop).toBe(400);
  });

  it('scrolls the list container when typing starts while near the end', async () => {
    mountHost();
    await nextTick();

    const list = mockListMetrics({ scrollTop: 300 });
    wrapper.vm.isTyping = true;
    await nextTick();
    await nextTick();

    expect(list.scrollTop).toBe(400);
  });

  it('does not auto-scroll when the user has scrolled away from the end', async () => {
    mountHost();
    await nextTick();

    const list = mockListMetrics({ scrollTop: 300 });
    wrapper.vm.messages.push({ id: '1' });
    await nextTick();
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    mockListMetrics({ scrollTop: 0 });
    list.dispatchEvent(new Event('scroll'));
    await nextTick();

    expect(wrapper.vm.showGoToBottom).toBe(true);

    const previousScrollTop = list.scrollTop;
    wrapper.vm.messages.push({ id: '2' });
    await nextTick();
    await nextTick();

    expect(list.scrollTop).toBe(previousScrollTop);
    expect(wrapper.vm.showGoToBottom).toBe(true);
  });

  it('treats upward wheel gestures as leaving the bottom', async () => {
    mountHost();
    await nextTick();

    const list = mockListMetrics({ scrollTop: 320 });
    list.dispatchEvent(new WheelEvent('wheel', { deltaY: -40 }));
    await nextTick();

    expect(wrapper.vm.showGoToBottom).toBe(true);

    const previousScrollTop = list.scrollTop;
    wrapper.vm.messages.push({ id: '1' });
    await nextTick();
    await nextTick();

    expect(list.scrollTop).toBe(previousScrollTop);
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
