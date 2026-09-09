import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import { useRooms } from '@/store/modules/chats/rooms';

import QuickMessageBulkForm from '../QuickMessageBulkForm.vue';

const finishInfiniteScrollMock = vi.fn();

const createRoom = (uuid, contactUuid, name) => ({
  uuid,
  user: { email: 'agent@test.com' },
  is_waiting: false,
  contact: { uuid: contactUuid, name },
});

const createWrapper = (roomsState = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      rooms: {
        rooms: Array.from({ length: 30 }, (_, index) =>
          createRoom(`room-${index}`, `contact-${index}`, `Contact ${index}`),
        ),
        hasNextRooms: {
          waiting: false,
          ongoing: true,
          flow_start: false,
        },
        orderBy: {
          ongoing: '-last_interaction',
          waiting: 'added_to_queue_at',
          flow_start: '-last_interaction',
          discussions: '-last_interaction',
        },
        ...roomsState,
      },
      roomCounters: {
        counts: { ongoing: 50, waiting: 0, flow_start: 0 },
      },
      bulkQuickMessageSend: {
        isSending: false,
        sendingUuid: null,
        percentageSent: 0,
        totalToSend: 0,
      },
    },
  });

  return mount(QuickMessageBulkForm, {
    props: {
      quickMessage: { text: 'Hello', uuid: 'qm-1' },
    },
    global: {
      plugins: [pinia],
      stubs: {
        ModalProgressBar: true,
        UnnnicButton: true,
        UnnnicCheckbox: true,
        UnnnicMultiSelect: {
          name: 'UnnnicMultiSelect',
          template:
            '<div data-testid="quick-message-bulk-contacts-select"></div>',
          props: [
            'infiniteScroll',
            'infiniteScrollCanLoadMore',
            'options',
            'modelValue',
            'label',
            'message',
          ],
          methods: {
            finishInfiniteScroll: finishInfiniteScrollMock,
          },
        },
      },
    },
  });
};

describe('QuickMessageBulkForm.vue', () => {
  beforeEach(() => {
    finishInfiniteScrollMock.mockClear();
    vi.clearAllMocks();
  });

  it('enables infinite scroll on contacts multiselect', () => {
    const wrapper = createWrapper();
    const multiSelect = wrapper.findComponent({ name: 'UnnnicMultiSelect' });

    expect(multiSelect.props('infiniteScrollCanLoadMore')).toBeDefined();
  });

  it('calls getAll on scroll-end when hasNextRooms.ongoing is true', async () => {
    const wrapper = createWrapper();
    const roomsStore = useRooms();

    await wrapper
      .findComponent({ name: 'UnnnicMultiSelect' })
      .vm.$emit('scroll-end');
    await flushPromises();

    expect(roomsStore.getAll).toHaveBeenCalledWith({
      offset: 30,
      limit: 30,
      concat: true,
      roomsType: 'ongoing',
      order: '-last_interaction',
    });
    expect(finishInfiniteScrollMock).toHaveBeenCalled();
  });

  it('does not call getAll on scroll-end when hasNextRooms.ongoing is false', async () => {
    const wrapper = createWrapper({
      hasNextRooms: {
        waiting: false,
        ongoing: false,
        flow_start: false,
      },
    });
    const roomsStore = useRooms();

    await wrapper
      .findComponent({ name: 'UnnnicMultiSelect' })
      .vm.$emit('scroll-end');
    await flushPromises();

    expect(roomsStore.getAll).not.toHaveBeenCalled();
    expect(finishInfiniteScrollMock).toHaveBeenCalled();
  });

  it('calls finishInfiniteScroll after getAll completes', async () => {
    const wrapper = createWrapper();
    const roomsStore = useRooms();
    let resolveGetAll;

    roomsStore.getAll.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGetAll = resolve;
        }),
    );

    await wrapper
      .findComponent({ name: 'UnnnicMultiSelect' })
      .vm.$emit('scroll-end');
    await flushPromises();

    expect(finishInfiniteScrollMock).not.toHaveBeenCalled();

    resolveGetAll([]);
    await flushPromises();

    expect(finishInfiniteScrollMock).toHaveBeenCalled();
  });
});
