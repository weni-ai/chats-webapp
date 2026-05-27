import { flushPromises, mount, config } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import ModalCloseRooms from '../ModalCloseRooms.vue';

import Queue from '@/services/api/resources/settings/queue';
import Room from '@/services/api/resources/chats/room';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';
import {
  markPendingClose,
  unmarkPendingClose,
} from '@/services/api/websocket/listeners/room/update';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/websocket/listeners/room/update', () => ({
  markPendingClose: vi.fn(),
  unmarkPendingClose: vi.fn(),
}));

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  vi.restoreAllMocks();
});

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    tags: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    bulkClose: vi.fn(() => ({
      data: { success_count: 1, failed_count: 0 },
    })),
    getAll: vi.fn(() => Promise.resolve({ results: [], next: null, count: 0 })),
  },
}));

vi.mock('@weni/unnnic-system', () => ({
  unnnicCallAlert: vi.fn(),
}));

const tagsResponse = {
  results: [
    { uuid: 'tag1', name: 'Tag 1' },
    { uuid: 'tag2', name: 'Tag 2' },
  ],
  next: null,
};

const emptyTagsResponse = {
  results: [],
  next: null,
};

const roomWithQueue = {
  uuid: 'room-1',
  queue: {
    uuid: 'queue-1',
    sector: 'sector-1',
    sector_name: 'Support',
    name: 'Support Queue',
    required_tags: false,
  },
  contact: { name: 'Contact 1' },
};

const createDialogStubs = () => ({
  UnnnicButton: {
    name: 'UnnnicButtonStub',
    props: ['text', 'disabled', 'loading', 'type'],
    template: `
      <button
        :data-testid="type === 'primary' ? 'primary-button' : 'secondary-button'"
        :disabled="disabled"
        @click="$emit('click', $event)"
      >
        {{ text }}
      </button>
    `,
  },
});

const createWrapper = (tagsMock = tagsResponse, roomOverrides = {}) => {
  Queue.tags.mockReset();
  Queue.tags.mockResolvedValue(tagsMock);

  const room = { ...roomWithQueue, ...roomOverrides };
  if (roomOverrides.queue) {
    room.queue = { ...roomWithQueue.queue, ...roomOverrides.queue };
  }

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      rooms: {
        activeTab: 'ongoing',
        selectedOngoingRooms: ['room-1'],
        selectedWaitingRooms: [],
        rooms: [room],
      },
    },
  });

  setActivePinia(pinia);

  return mount(ModalCloseRooms, {
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key) => key,
        $tc: (key) => key,
      },
      stubs: {
        ...createDialogStubs(),
        ChatClassifier: true,
        UnnnicDisclaimer: true,
        UnnnicInput: true,
        UnnnicTag: true,
      },
    },
  });
};

describe('ModalCloseRooms.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when sector has tags', () => {
    let wrapper;

    beforeEach(async () => {
      wrapper = createWrapper(tagsResponse);
      await flushPromises();
      await wrapper.vm.$nextTick();
    });

    it('should render the modal', () => {
      const modal = wrapper.find('[data-testid="modal-bulk-close"]');
      expect(modal.exists()).toBe(true);
    });

    it('should not show no-tags message', () => {
      const noTags = wrapper.find('.modal-close-rooms__no-tags');
      expect(noTags.exists()).toBe(false);
    });

    it('should show ChatClassifier', () => {
      const classifier = wrapper.findComponent({ name: 'ChatClassifier' });
      expect(classifier.exists()).toBe(true);
    });

    it('should show UnnnicInput for tag search', () => {
      const input = wrapper.findComponent({ name: 'UnnnicInput' });
      expect(input.exists()).toBe(true);
    });

    it('should load sector tags on mount', () => {
      expect(Queue.tags).toHaveBeenCalledWith('queue-1', {
        limit: 20,
        next: null,
      });
    });
  });

  describe('when sector has no tags', () => {
    let wrapper;

    beforeEach(async () => {
      wrapper = createWrapper(emptyTagsResponse);
      await flushPromises();
      await wrapper.vm.$nextTick();
    });

    it('should show no-tags message', () => {
      const noTags = wrapper.find('.modal-close-rooms__no-tags');
      expect(noTags.exists()).toBe(true);
    });

    it('should not show ChatClassifier', () => {
      const classifier = wrapper.findComponent({ name: 'ChatClassifier' });
      expect(classifier.exists()).toBe(false);
    });

    it('should not show UnnnicInput for tag search', () => {
      const input = wrapper.findComponent({ name: 'UnnnicInput' });
      expect(input.exists()).toBe(false);
    });

    it('should not disable the primary button', () => {
      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.attributes('disabled')).toBeUndefined();
    });

    it('should still show the disclaimer', () => {
      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.exists()).toBe(true);
    });
  });

  describe('primary button disabled state with required tags', () => {
    it('should disable primary when required_tags is true and no tags selected', async () => {
      const wrapper = createWrapper(tagsResponse, {
        queue: { required_tags: true },
      });

      await flushPromises();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.element.disabled).toBe(true);
    });

    it('should not disable primary when required_tags is true but no tags exist in sector', async () => {
      const wrapper = createWrapper(emptyTagsResponse, {
        queue: { required_tags: true },
      });

      await flushPromises();
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.element.disabled).toBe(false);
    });
  });

  describe('optimistic close', () => {
    const createWrapperForOptimisticClose = ({
      bulkCloseResponse,
      tags = emptyTagsResponse,
    } = {}) => {
      Queue.tags.mockReset();
      Queue.tags.mockResolvedValue(tags);
      Room.bulkClose.mockReset();
      Room.bulkClose.mockResolvedValue(bulkCloseResponse);

      const pinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
        initialState: {
          rooms: {
            activeTab: 'ongoing',
            selectedOngoingRooms: ['room-1'],
            selectedWaitingRooms: [],
            rooms: [roomWithQueue],
          },
        },
      });

      setActivePinia(pinia);

      return mount(ModalCloseRooms, {
        global: {
          plugins: [pinia],
          mocks: {
            $t: (key) => key,
            $tc: (key) => key,
          },
          stubs: {
            ...createDialogStubs(),
            ChatClassifier: true,
            UnnnicDisclaimer: true,
            UnnnicInput: true,
            UnnnicTag: true,
          },
        },
      });
    };

    beforeEach(() => {
      markPendingClose.mockClear();
      unmarkPendingClose.mockClear();
    });

    it('marks pending closes, applies optimistic close on success, and decrements the counter', async () => {
      const wrapper = createWrapperForOptimisticClose({
        bulkCloseResponse: {
          data: {
            success_count: 1,
            failed_count: 0,
            success_uuids: ['room-1'],
          },
        },
      });

      await flushPromises();
      await wrapper.vm.$nextTick();

      const roomsStore = useRooms();
      const counters = useRoomCounters();
      roomsStore.applyClose = vi.fn(() => 'ongoing');
      counters.handleClose = vi.fn();
      counters.clearTypeCache = vi.fn();
      roomsStore.setSelectedOngoingRooms = vi.fn();
      roomsStore.getAll = vi.fn().mockResolvedValue(undefined);

      await wrapper.find('[data-testid="primary-button"]').trigger('click');
      await flushPromises();

      expect(markPendingClose).toHaveBeenCalledWith('room-1');
      expect(Room.bulkClose).toHaveBeenCalled();
      expect(roomsStore.applyClose).toHaveBeenCalledWith('room-1');
      expect(counters.handleClose).toHaveBeenCalledWith('ongoing');
      expect(counters.clearTypeCache).toHaveBeenCalledWith('room-1');
    });

    it('unmarks pending close for uuids that failed in the API response', async () => {
      const wrapper = createWrapperForOptimisticClose({
        bulkCloseResponse: {
          data: { success_count: 0, failed_count: 1, success_uuids: [] },
        },
      });

      await flushPromises();
      await wrapper.vm.$nextTick();

      const roomsStore = useRooms();
      roomsStore.applyClose = vi.fn();
      roomsStore.setSelectedOngoingRooms = vi.fn();

      await wrapper.find('[data-testid="primary-button"]').trigger('click');
      await flushPromises();

      expect(markPendingClose).toHaveBeenCalledWith('room-1');
      expect(unmarkPendingClose).toHaveBeenCalledWith('room-1');
      expect(roomsStore.applyClose).not.toHaveBeenCalled();
    });
  });
});
