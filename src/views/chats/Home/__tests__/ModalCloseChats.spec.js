import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import ModalCloseChat from '../ModalCloseChat.vue';

import Queue from '@/services/api/resources/settings/queue';
import Room from '@/services/api/resources/chats/room';

const roomMock = { uuid: '123', queue: { uuid: '456' } };

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    tags: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    close: vi.fn(),
  },
}));

const tagsResponse = {
  results: [
    { uuid: 'tag1', name: 'Tag 1' },
    { uuid: 'tag2', name: 'Tag 2' },
  ],
  next: null,
};

Queue.tags
  .mockResolvedValue(tagsResponse)
  .mockResolvedValueOnce({ ...tagsResponse, next: true });

const createWrapper = () => {
  return mount(ModalCloseChat, {
    props: { room: roomMock },
    global: { plugins: [createTestingPinia()] },
  });
};

describe('ModalCloseChats.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should loads and concatenates tags correctly in classifyRoom', async () => {
    const classifyRoom = vi.spyOn(ModalCloseChat.methods, 'classifyRoom');
    const localWrapper = createWrapper();

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(Queue.tags).toHaveBeenCalledWith(roomMock.queue.uuid, 0, 20);
    expect(Queue.tags).toHaveBeenCalledWith(roomMock.queue.uuid, 20, 20);

    expect(classifyRoom).toHaveBeenCalled();

    expect(localWrapper.vm.sectorTags).toEqual(tagsResponse.results);
    expect(localWrapper.vm.isLoadingTags).toBe(false);
  });

  it('should emits "close" event when cancel button is clicked', async () => {
    await wrapper.find('[data-testid="cancel-button"]').trigger('click');
    expect(wrapper.emitted()).toHaveProperty('close');
  });

  it('calls Room.close and emits "close" event when closeRoom is called', async () => {
    wrapper.vm.tags = [{ uuid: 'tag1' }];

    const confirmButton = wrapper.find('[data-testid="confirm-button"]');

    await confirmButton.trigger('click');

    expect(Room.close).toHaveBeenCalledWith('123', ['tag1']);
    expect(wrapper.emitted()).toHaveProperty('close');
  });
});
