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
    getRoomTags: vi.fn(() => ({ results: [] })),
  },
}));

vi.mock('@/services/api/resources/chats/feedback', () => ({
  default: {
    getIsShowFeedback: vi.fn(() => ({ should_show_feedback_form: false })),
  },
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

const createDialogStubs = () => ({
  UnnnicDialog: {
    name: 'UnnnicDialogStub',
    props: ['open'],
    template: `
      <div v-if="open" v-bind="$attrs">
        <slot />
      </div>
    `,
  },
  UnnnicDialogContent: {
    name: 'UnnnicDialogContentStub',
    props: ['size'],
    template: '<div :data-size="size"><slot /></div>',
  },
  UnnnicDialogHeader: {
    name: 'UnnnicDialogHeaderStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogTitle: {
    name: 'UnnnicDialogTitleStub',
    template: '<div data-testid="dialog-title"><slot /></div>',
  },
  UnnnicDialogFooter: {
    name: 'UnnnicDialogFooterStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogClose: {
    name: 'UnnnicDialogCloseStub',
    template: '<div><slot /></div>',
  },
  UnnnicButton: {
    name: 'UnnnicButtonStub',
    props: ['text', 'disabled', 'loading', 'type'],
    template: `
      <button
        :data-testid="type === 'primary' ? 'close-chat-button' : 'cancel-button'"
        :disabled="disabled"
        @click="$emit('click')"
      >
        {{ text }}
      </button>
    `,
  },
});

const createWrapper = (queueTagsMock) => {
  if (queueTagsMock) {
    Queue.tags.mockReset();
    Queue.tags.mockResolvedValue(queueTagsMock);
  }

  return mount(ModalCloseChat, {
    props: { room: roomMock, modelValue: true },
    global: {
      plugins: [createTestingPinia()],
      stubs: {
        ...createDialogStubs(),
        ChatClassifier: true,
        UnnnicDisclaimer: true,
        UnnnicInput: true,
      },
    },
  });
};

describe('ModalCloseChats.vue', () => {
  let wrapper;

  beforeEach(() => {
    Queue.tags.mockReset();
    Queue.tags
      .mockResolvedValue(tagsResponse)
      .mockResolvedValueOnce({ ...tagsResponse, next: true });
    wrapper = createWrapper();
  });

  it('should loads and concatenates tags correctly in classifyRoom', async () => {
    const classifyRoom = vi.spyOn(ModalCloseChat.methods, 'classifyRoom');
    const localWrapper = createWrapper();

    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(Queue.tags).toHaveBeenCalledWith(roomMock.queue.uuid, {
      limit: 20,
      next: '',
    });

    expect(classifyRoom).toHaveBeenCalled();

    expect(localWrapper.vm.sectorTags).toEqual(tagsResponse.results);
    expect(localWrapper.vm.isLoadingTags).toBe(false);
  });

  it('calls Room.close and emits "close" event when closeRoom is called', async () => {
    wrapper.vm.tags = [{ uuid: 'tag1' }];

    const closeChatButton = wrapper.findComponent(
      '[data-testid="close-chat-button"]',
    );

    await closeChatButton.trigger('click');

    expect(Room.close).toHaveBeenCalledWith('123', ['tag1']);
    expect(wrapper.emitted()).toHaveProperty('close');
  });

  describe('when sector has no tags', () => {
    let noTagsWrapper;

    beforeEach(async () => {
      noTagsWrapper = createWrapper(emptyTagsResponse);
      await flushPromises();
      await noTagsWrapper.vm.$nextTick();
    });

    it('should set hasNoSectorTags to true', () => {
      expect(noTagsWrapper.vm.hasNoSectorTags).toBe(true);
    });

    it('should show confirmation text instead of tag UI', () => {
      const confirmText = noTagsWrapper.find('.modal-close-chat__confirm-text');
      expect(confirmText.exists()).toBe(true);
    });

    it('should not show ChatClassifier', () => {
      const classifier = noTagsWrapper.findComponent({
        name: 'ChatClassifier',
      });
      expect(classifier.exists()).toBe(false);
    });

    it('should not show UnnnicInput for tag search', () => {
      const input = noTagsWrapper.findComponent({ name: 'UnnnicInput' });
      expect(input.exists()).toBe(false);
    });

    it('should use medium dialog size', () => {
      const content = noTagsWrapper.find('[data-size="medium"]');
      expect(content.exists()).toBe(true);
    });

    it('should still allow closing the room', async () => {
      const closeChatButton = noTagsWrapper.find(
        '[data-testid="close-chat-button"]',
      );
      expect(closeChatButton.attributes('disabled')).toBeUndefined();

      await closeChatButton.trigger('click');
      expect(Room.close).toHaveBeenCalledWith('123', []);
    });
  });

  describe('when sector has tags', () => {
    let withTagsWrapper;

    beforeEach(async () => {
      withTagsWrapper = createWrapper(tagsResponse);
      await flushPromises();
      await withTagsWrapper.vm.$nextTick();
    });

    it('should set hasNoSectorTags to false', () => {
      expect(withTagsWrapper.vm.hasNoSectorTags).toBe(false);
    });

    it('should not show confirmation text', () => {
      const confirmText = withTagsWrapper.find(
        '.modal-close-chat__confirm-text',
      );
      expect(confirmText.exists()).toBe(false);
    });

    it('should show ChatClassifier', () => {
      const classifier = withTagsWrapper.findComponent({
        name: 'ChatClassifier',
      });
      expect(classifier.exists()).toBe(true);
    });

    it('should use large dialog size', () => {
      const content = withTagsWrapper.find('[data-size="large"]');
      expect(content.exists()).toBe(true);
    });
  });
});
