import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import ModalStartDiscussion from '../ModalStartDiscussion.vue';

import { createTestingPinia } from '@pinia/testing';
import { createMemoryHistory, createRouter } from 'vue-router';

import { useDiscussions } from '@/store/modules/chats/discussions';

import Queue from '@/services/api/resources/settings/queue';

vi.mock('@/services/api/resources/chats/discussion', () => ({
  default: {
    getSectors: vi.fn(() =>
      Promise.resolve({ results: [{ uuid: '1', name: 'Sector' }] }),
    ),
  },
}));

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    list: vi.fn(() =>
      Promise.resolve({ results: [{ uuid: '1', name: 'Queue' }] }),
    ),
  },
}));

const routes = [{ path: '/settings', name: 'settings' }];
const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

router.push = vi.fn();

describe('ModalStartDiscussion', () => {
  let wrapper;
  let discussionsStore;

  beforeEach(() => {
    wrapper = mount(ModalStartDiscussion, {
      global: { plugins: [createTestingPinia({ stubActions: true }), router] },
    });
    discussionsStore = useDiscussions();
  });

  it('renders correctly with initial data', () => {
    expect(wrapper.find('[data-testid="start-discussion-form"]').exists()).toBe(
      true,
    );

    expect(
      wrapper.findComponent('[data-testid="select-sector"]').exists(),
    ).toBe(true);

    expect(wrapper.findComponent('[data-testid="select-queue"]').exists()).toBe(
      true,
    );

    expect(
      wrapper.findComponent('[data-testid="input-subject"]').exists(),
    ).toBe(true);

    expect(
      wrapper.findComponent('[data-testid="input-explain-situation"]').exists(),
    ).toBe(true);
  });

  it('enables confirm button only when all fields are filled', async () => {
    const confirmButton = wrapper.findComponent(
      '[data-testid="confirm-button"]',
    );

    expect(confirmButton.props('disabled')).toBe(true);

    await wrapper.setData({
      sector: [{ value: '1', label: 'Sector' }],
      queue: [{ value: '1', label: 'Queue' }],
      subject: 'Test Subject',
      message: 'Test Message',
    });

    await wrapper.vm.$nextTick();

    await expect(confirmButton.props('disabled')).toBe(false);
  });

  it('should emit close event on click cancel button', async () => {
    const closeSpy = vi.spyOn(wrapper.vm, 'close');
    const cancelButton = wrapper.findComponent('[data-testid="cancel-button"]');
    await cancelButton.trigger('click');
    expect(closeSpy).toHaveBeenCalled();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('loads queues when sector is selected', async () => {
    await wrapper.setData({ sector: [{ value: '1', label: 'Sector' }] });

    expect(Queue.list).toHaveBeenCalledWith('1');

    expect(wrapper.vm.queuesToSelect).toEqual([
      {
        value: '',
        label: wrapper.vm.$t('discussions.start_discussion.form.search_queue'),
      },
      { value: '1', label: 'Queue' },
    ]);
  });

  it('creates a new discussion and redirects', async () => {
    await wrapper.setData({
      sector: [{ value: '1', label: 'Sector' }],
      queue: [{ value: '1', label: 'Queue' }],
      subject: 'Test Subject',
      message: 'Test Message',
    });

    await flushPromises();

    discussionsStore.create = vi.fn(() => Promise.resolve({ uuid: '1' }));

    await wrapper
      .findComponent('[data-testid="confirm-button"]')
      .trigger('click');

    expect(discussionsStore.create).toHaveBeenCalledWith({
      queue: '1',
      subject: 'Test Subject',
      initial_message: 'Test Message',
    });

    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({
      name: 'discussion',
      params: { discussionId: '1' },
    });
  });
});
