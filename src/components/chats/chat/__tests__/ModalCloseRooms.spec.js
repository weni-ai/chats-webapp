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
import i18n from '@/plugins/i18n';

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
});
