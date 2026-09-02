import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AiMessage from '../AiMessage.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';

vi.mock('@weni/unnnic-system', () => ({
  UnnnicCallAlert: vi.fn(),
}));

const createWrapper = (props = {}) =>
  mount(AiMessage, {
    props: {
      text: 'Intro text',
      suggestion: 'Suggested reply for the customer',
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicIcon: true,
        UnnnicButton: {
          name: 'UnnnicButton',
          template: '<button @click="$emit(\'click\')"><slot /></button>',
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
      },
    },
  });

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
});
