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

describe('QuickMessagesList.vue', () => {
  let observeMock;
  let intersectionCallback;

  beforeEach(() => {
    observeMock = vi.fn((element) => {
      intersectionCallback?.([
        {
          isIntersecting: true,
          target: element,
        },
      ]);
    });

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

  it('emits load-more when sentinel intersects and hasMore is true', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: true,
      quickMessages,
    });

    await flushPromises();

    expect(wrapper.emitted('load-more')).toBeTruthy();
  });

  it('does not emit load-more when hasMore is false', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: false,
      quickMessages,
    });

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
    expect(wrapper.emitted('load-more')).toBeFalsy();

    await wrapper.setProps({ loadingMore: false });
    await flushPromises();

    expect(wrapper.emitted('load-more')).toBeTruthy();
  });

  it('emits load-more when hasMore becomes true after the first page loads', async () => {
    const wrapper = createWrapper({
      infiniteScroll: true,
      hasMore: false,
      quickMessages,
    });

    await flushPromises();
    expect(wrapper.emitted('load-more')).toBeFalsy();

    await wrapper.setProps({ hasMore: true });
    await flushPromises();

    expect(wrapper.emitted('load-more')).toBeTruthy();
  });
});
