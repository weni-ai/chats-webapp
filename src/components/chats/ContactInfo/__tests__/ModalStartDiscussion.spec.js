import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises, mount, config } from '@vue/test-utils';

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
      global: {
        plugins: [createTestingPinia({ stubActions: true }), router],
        mocks: {
          $t: (key) => key,
        },
        components: {
          UnnnicModalDialog: config.global.stubs.UnnnicModalDialog,
        },
        stubs: {
          teleport: true,
        },
      },
    });
    discussionsStore = useDiscussions();
  });

  it('renders correctly with initial data', () => {
    const modal = wrapper.findComponent({ name: 'UnnnicModalDialogStub' });
    expect(modal.exists()).toBe(true);

    // Verify component has the necessary form fields
    expect(wrapper.vm.sector).toBeDefined();
    expect(wrapper.vm.queue).toBeDefined();
    expect(wrapper.vm.subject).toBeDefined();
    expect(wrapper.vm.message).toBeDefined();
  });

  it('enables confirm button only when all fields are filled', async () => {
    // Initially button should be disabled
    expect(wrapper.vm.isConfirmButtonDisabled).toBe(true);

    await wrapper.setData({
      sector: [{ value: '1', label: 'Sector' }],
      queue: [{ value: '1', label: 'Queue' }],
      subject: 'Test Subject',
      message: 'Test Message',
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.isConfirmButtonDisabled).toBe(false);
  });

  it('should emit close event when close method is called', async () => {
    const closeSpy = vi.spyOn(wrapper.vm, 'close');
    await wrapper.vm.close();
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

    await wrapper.vm.startDiscussion();

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
