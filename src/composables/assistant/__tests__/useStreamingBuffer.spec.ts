import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { useStreamingBuffer } from '../useStreamingBuffer';

describe('useStreamingBuffer', () => {
  let wrapper;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function mountHost({
    text = '',
    isStreaming = false,
  }: {
    text?: string;
    isStreaming?: boolean;
  } = {}) {
    const textRef = ref(text);
    const streamingRef = ref(isStreaming);
    const onWordRevealed = vi.fn();

    const Host = defineComponent({
      setup() {
        const { displayedText, isBuffering } = useStreamingBuffer(
          textRef,
          streamingRef,
          onWordRevealed,
        );

        return {
          textRef,
          streamingRef,
          displayedText,
          isBuffering,
          onWordRevealed,
        };
      },
      template: '<div />',
    });

    wrapper = mount(Host);
    return wrapper;
  }

  it('shows the full text immediately when not streaming', () => {
    mountHost({ text: 'Hello world', isStreaming: false });

    expect(wrapper.vm.displayedText).toBe('Hello world');
    expect(wrapper.vm.isBuffering).toBe(false);
  });

  it('reveals words gradually while streaming and keeps buffering until done', async () => {
    mountHost({ text: 'Hello world', isStreaming: true });

    expect(wrapper.vm.displayedText).toBe('');
    expect(wrapper.vm.isBuffering).toBe(true);

    await vi.advanceTimersByTimeAsync(100);
    expect(wrapper.vm.displayedText).toBe('Hello ');
    expect(wrapper.vm.onWordRevealed).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(wrapper.vm.displayedText).toBe('Hello world');
    expect(wrapper.vm.isBuffering).toBe(true);

    wrapper.vm.streamingRef = false;
    await nextTick();
    await vi.advanceTimersByTimeAsync(100);

    expect(wrapper.vm.displayedText).toBe('Hello world');
    expect(wrapper.vm.isBuffering).toBe(false);
  });
});
