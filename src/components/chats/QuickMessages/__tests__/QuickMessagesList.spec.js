import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import QuickMessagesList from '../QuickMessagesList.vue';

const quickMessages = [
  { uuid: '1', title: 'A', text: 'Message A', shortcut: 'a' },
  { uuid: '2', title: 'B', text: 'Message B', shortcut: 'b' },
];

const createWrapper = (props = {}) => {
  return mount(QuickMessagesList, {
    props: {
      quickMessages: [],
      title: 'Shared',
      ...props,
    },
    global: {
      stubs: {
        QuickMessageCard: true,
        UnnnicButton: true,
        UnnnicIcon: true,
        UnnnicIconLoading: true,
      },
    },
  });
};

const mockSentinelRect = (wrapper, { top, bottom }) => {
  const sentinel = wrapper.find('[data-testid="sentinel"]').element;

  vi.spyOn(sentinel, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom,
    left: 0,
    right: 100,
    width: 100,
    height: bottom - top,
  });
};

describe('QuickMessagesList.vue', () => {
  let observeMock;
  let intersectionCallback;

  beforeEach(() => {
    observeMock = vi.fn();

    global.IntersectionObserver = vi.fn((callback) => {
      intersectionCallback = callback;

      return {
        observe: observeMock,
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets up infinite scroll after messages are loaded', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: true,
    });

    expect(observeMock).not.toHaveBeenCalled();

    await wrapper.setProps({ quickMessages });
    await flushPromises();

    expect(observeMock).toHaveBeenCalled();
  });

  it('emits load-more when sentinel intersects via IntersectionObserver', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: true,
      quickMessages,
    });

    await flushPromises();

    intersectionCallback?.([
      {
        isIntersecting: true,
        target: wrapper.find('[data-testid="sentinel"]').element,
      },
    ]);

    expect(wrapper.emitted('load-more')).toBeTruthy();
  });

  it('does not emit load-more when hasMore is false', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: false,
      quickMessages,
    });

    await flushPromises();

    intersectionCallback?.([
      {
        isIntersecting: true,
        target: wrapper.find('[data-testid="sentinel"]').element,
      },
    ]);

    expect(wrapper.emitted('load-more')).toBeFalsy();
  });

  it('does not emit load-more while loadingMore is true', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: true,
      loadingMore: true,
      quickMessages,
    });

    await flushPromises();

    intersectionCallback?.([
      {
        isIntersecting: true,
        target: wrapper.find('[data-testid="sentinel"]').element,
      },
    ]);
    await flushPromises();

    expect(wrapper.emitted('load-more')).toBeFalsy();
  });

  it('emits load-more again after loading completes while sentinel is visible', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: true,
      loadingMore: true,
      quickMessages,
    });

    await flushPromises();
    mockSentinelRect(wrapper, { top: 500, bottom: 510 });

    await wrapper.setProps({ loadingMore: false });
    await flushPromises();
    expect(wrapper.emitted('load-more')).toHaveLength(1);

    await wrapper.setProps({ loadingMore: true });
    await flushPromises();
    expect(wrapper.emitted('load-more')).toHaveLength(1);

    await wrapper.setProps({ loadingMore: false });
    await flushPromises();
    expect(wrapper.emitted('load-more')).toHaveLength(2);
  });

  it('emits load-more when hasMore becomes true and sentinel is within viewport', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: false,
      quickMessages,
    });

    await flushPromises();
    mockSentinelRect(wrapper, { top: 500, bottom: 510 });

    await wrapper.setProps({ hasMore: true });
    await flushPromises();

    expect(wrapper.emitted('load-more')).toBeTruthy();
  });

  it('does not emit load-more when sentinel is above the viewport', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: false,
      quickMessages,
    });

    await flushPromises();
    mockSentinelRect(wrapper, { top: -1000, bottom: -999 });

    await wrapper.setProps({ hasMore: true });
    await flushPromises();

    expect(wrapper.emitted('load-more')).toBeFalsy();
  });

  it('does not emit load-more when sentinel is below the viewport', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: false,
      quickMessages,
    });

    await flushPromises();
    mockSentinelRect(wrapper, {
      top: window.innerHeight + 200,
      bottom: window.innerHeight + 210,
    });

    await wrapper.setProps({ hasMore: true });
    await flushPromises();

    expect(wrapper.emitted('load-more')).toBeFalsy();
  });
});
