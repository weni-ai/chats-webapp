import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AiMessage from '../AiMessage.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useRooms } from '@/store/modules/chats/rooms';
import CopilotFeedback from '@/services/api/resources/chats/copilotFeedback';

vi.mock('@weni/unnnic-system', () => ({
  UnnnicCallAlert: vi.fn(),
}));

vi.mock('@/services/api/resources/chats/copilotFeedback', () => ({
  default: {
    getMessageFeedbackTags: vi.fn(() => [
      { key: 'incorrect_answer', name: 'Incorrect answer' },
    ]),
    sendMessageFeedback: vi.fn(),
  },
}));

const createWrapper = (props = {}) => {
  const roomsStore = useRooms();
  roomsStore.$patch({
    activeRoom: {
      uuid: 'room-1',
    },
  });

  return mount(AiMessage, {
    props: {
      text: 'Intro text',
      suggestion: 'Suggested reply for the customer',
      messageId: 'msg-1',
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicIcon: {
          name: 'UnnnicIcon',
          template:
            '<button class="unnnic-icon" :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')" />',
          inheritAttrs: false,
        },
        UnnnicButton: {
          name: 'UnnnicButton',
          template:
            '<button :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')"><slot /></button>',
          inheritAttrs: false,
        },
        UnnnicToolTip: {
          name: 'UnnnicToolTip',
          template: '<div><slot /></div>',
        },
        ProductCarousel: {
          name: 'ProductCarousel',
          template: '<div data-testid="assistant-ai-product-carousel" />',
          props: ['products', 'getQuantity', 'dismissedIds'],
        },
        ProductListSections: {
          name: 'ProductListSections',
          template: '<div data-testid="assistant-ai-product-list" />',
          props: ['sections', 'header', 'getQuantity', 'dismissedIds'],
        },
        AiFeedbackModal: {
          name: 'AiFeedbackModal',
          template: '<div data-testid="ai-feedback-modal" />',
          props: ['modelValue', 'tags', 'isLoadingTags', 'isSubmitting'],
        },
      },
    },
  });
};

describe('AssistantAiMessage', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('renders leading text and suggestion when suggestion is provided', () => {
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="assistant-ai-leading"]').text()).toBe(
      'Intro text',
    );
    expect(
      wrapper.find('[data-testid="assistant-ai-suggestion"]').text(),
    ).toContain('Suggested reply for the customer');
  });

  it('uses text as suggestion when metadata suggestion is missing', () => {
    wrapper = createWrapper({
      text: 'Only text reply',
      suggestion: undefined,
    });

    expect(wrapper.find('[data-testid="assistant-ai-leading"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.find('[data-testid="assistant-ai-suggestion"]').text(),
    ).toContain('Only text reply');
  });

  it('emits send with the suggestion text', async () => {
    wrapper = createWrapper();

    await wrapper.find('[data-testid="assistant-ai-send"]').trigger('click');

    expect(wrapper.emitted('send')?.[0]).toEqual([
      'Suggested reply for the customer',
    ]);
  });

  it('copies the suggestion into the contact chat input', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const messageManager = useMessageManager();
    wrapper = createWrapper();
    await wrapper.find('[data-testid="assistant-ai-copy"]').trigger('click');

    expect(writeText).toHaveBeenCalledWith('Suggested reply for the customer');
    expect(messageManager.inputMessage).toBe(
      'Suggested reply for the customer',
    );
  });

  it('shows a caret inside the suggestion box and hides actions while streaming', () => {
    wrapper = createWrapper({
      text: 'Hello world',
      suggestion: undefined,
      status: 'streaming',
    });

    const suggestion = wrapper.find('[data-testid="assistant-ai-suggestion"]');

    expect(suggestion.exists()).toBe(true);
    expect(suggestion.classes()).not.toContain(
      'ai-message__suggestion--streaming',
    );
    expect(wrapper.find('[data-testid="assistant-ai-caret"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="assistant-ai-actions"]').exists()).toBe(
      false,
    );
  });

  it('renders product carousel and hides copy action for carousel messages', async () => {
    wrapper = createWrapper({
      text: 'Check these products',
      suggestion: undefined,
      productCarousel: {
        text: 'Check these products',
        items: [
          {
            product_retailer_id: 'sku-1',
            name: 'Tile',
            price: 32,
            sale_price: 27,
            currency: 'BRL',
            image: 'https://example.com/tile.png',
          },
        ],
      },
    });

    expect(
      wrapper.find('[data-testid="assistant-ai-product-carousel"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="assistant-ai-copy"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="assistant-ai-send"]').exists()).toBe(
      true,
    );

    await wrapper.find('[data-testid="assistant-ai-send"]').trigger('click');
    expect(wrapper.emitted('send')?.[0]).toEqual(['Check these products']);
  });

  it('renders product list sections and hides copy action for list messages', async () => {
    wrapper = createWrapper({
      text: 'Available TVs',
      suggestion: undefined,
      productList: {
        text: 'Available TVs',
        header: 'TV selection',
        sections: [
          {
            title: 'TV 32',
            items: [
              {
                product_retailer_id: 'tv-32-1',
                name: 'Smart TV 32"',
                price: 1099,
                currency: 'BRL',
                image: 'https://example.com/tv32.png',
              },
            ],
          },
        ],
      },
    });

    expect(
      wrapper.find('[data-testid="assistant-ai-product-list"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="assistant-ai-product-carousel"]').exists(),
    ).toBe(false);
    expect(wrapper.find('[data-testid="assistant-ai-copy"]').exists()).toBe(
      false,
    );

    await wrapper.find('[data-testid="assistant-ai-send"]').trigger('click');
    expect(wrapper.emitted('send')?.[0]).toEqual(['Available TVs']);
  });

  it('hides actions when readOnly', () => {
    wrapper = createWrapper({ readOnly: true });

    expect(wrapper.find('[data-testid="assistant-ai-actions"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="assistant-ai-copy"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="assistant-ai-send"]').exists()).toBe(
      false,
    );
  });

  it('hydrates the thumb from persisted liked state', () => {
    wrapper = createWrapper({ liked: false });

    expect(wrapper.vm.feedbackLiked).toBe(false);
  });

  it('sends positive feedback on thumb up', async () => {
    CopilotFeedback.sendMessageFeedback.mockResolvedValue({});
    wrapper = createWrapper();

    await wrapper
      .find('[data-testid="assistant-ai-thumb-up"]')
      .trigger('click');
    await flushPromises();

    expect(CopilotFeedback.sendMessageFeedback).toHaveBeenCalledWith({
      roomUuid: 'room-1',
      messageId: 'msg-1',
      liked: true,
    });
    expect(wrapper.vm.feedbackLiked).toBe(true);
  });

  it('reverts liked when sending positive feedback fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    CopilotFeedback.sendMessageFeedback.mockRejectedValue(
      new Error('Network error'),
    );
    wrapper = createWrapper();

    await wrapper
      .find('[data-testid="assistant-ai-thumb-up"]')
      .trigger('click');
    await flushPromises();

    expect(wrapper.vm.feedbackLiked).toBeNull();
    consoleSpy.mockRestore();
  });

  it('opens the feedback modal on thumb down', async () => {
    wrapper = createWrapper();

    await wrapper
      .find('[data-testid="assistant-ai-thumb-down"]')
      .trigger('click');

    const modal = wrapper.findComponent({ name: 'AiFeedbackModal' });
    expect(modal.props('modelValue')).toBe(true);
    expect(modal.props('tags')).toEqual([
      { key: 'incorrect_answer', name: 'Incorrect answer' },
    ]);
    expect(wrapper.vm.feedbackLiked).toBe(false);
  });

  it('sends negative feedback when the modal is submitted', async () => {
    CopilotFeedback.sendMessageFeedback.mockResolvedValue({});
    wrapper = createWrapper();

    await wrapper
      .find('[data-testid="assistant-ai-thumb-down"]')
      .trigger('click');
    await wrapper
      .findComponent({ name: 'AiFeedbackModal' })
      .vm.$emit('submit', {
        tags: ['incorrect_answer'],
        text: 'Wrong items',
      });
    await flushPromises();

    expect(CopilotFeedback.sendMessageFeedback).toHaveBeenCalledWith({
      roomUuid: 'room-1',
      messageId: 'msg-1',
      liked: false,
      text: 'Wrong items',
      tags: ['incorrect_answer'],
    });
    expect(
      wrapper.findComponent({ name: 'AiFeedbackModal' }).props('modelValue'),
    ).toBe(false);
  });

  it('reverts liked when the feedback modal is cancelled', async () => {
    wrapper = createWrapper();

    await wrapper
      .find('[data-testid="assistant-ai-thumb-up"]')
      .trigger('click');
    await wrapper
      .find('[data-testid="assistant-ai-thumb-down"]')
      .trigger('click');

    expect(wrapper.vm.feedbackLiked).toBe(false);

    await wrapper.findComponent({ name: 'AiFeedbackModal' }).vm.$emit('cancel');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.feedbackLiked).toBe(true);
    expect(
      wrapper.findComponent({ name: 'AiFeedbackModal' }).props('modelValue'),
    ).toBe(false);
  });
});
