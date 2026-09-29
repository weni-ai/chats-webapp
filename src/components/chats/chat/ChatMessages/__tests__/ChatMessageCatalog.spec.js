import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

import ChatMessageCatalog from '../ChatMessageCatalog.vue';

const catalog = {
  carousel: true,
  header: 'Novidades',
  products: [
    {
      product: 'product',
      product_retailer_ids: ['sku-1', 'sku-2'],
      product_retailer_info: [
        {
          retailer_id: 'sku-1',
          name: 'Tile',
          price: '32',
          sale_price: '27',
          currency: 'BRL',
          image: 'https://example.com/tile.png',
        },
        {
          retailer_id: 'sku-2',
          name: 'Rug',
          price: '189.90',
          currency: 'BRL',
        },
      ],
    },
  ],
};

const createWrapper = (props = {}) =>
  mount(ChatMessageCatalog, {
    props: {
      catalog,
      ...props,
    },
    global: {
      stubs: {
        UnnnicIcon: true,
      },
    },
  });

describe('ChatMessageCatalog', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders the header and product names', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="chat-message-catalog-header"]').text(),
    ).toBe('Novidades');
    expect(
      wrapper.find('[data-testid="chat-message-catalog-item-sku-1"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="chat-message-catalog-item-sku-2"]').exists(),
    ).toBe(true);
    expect(
      wrapper
        .find(
          '[data-testid="chat-message-catalog-item-sku-1"] [data-testid="chat-message-catalog-name"]',
        )
        .text(),
    ).toBe('Tile');
  });

  it('loads catalog images without sending a referrer', () => {
    wrapper = createWrapper();

    expect(
      wrapper
        .find('[data-testid="chat-message-catalog-image"]')
        .attributes('referrerpolicy'),
    ).toBe('no-referrer');
  });

  it('shows a placeholder when the product has no image', () => {
    wrapper = createWrapper();

    expect(
      wrapper
        .find(
          '[data-testid="chat-message-catalog-item-sku-2"] [data-testid="chat-message-catalog-image-placeholder"]',
        )
        .exists(),
    ).toBe(true);
  });

  it('hides the header when it is not provided', () => {
    wrapper = createWrapper({
      catalog: {
        carousel: true,
        products: catalog.products,
      },
    });

    expect(
      wrapper.find('[data-testid="chat-message-catalog-header"]').exists(),
    ).toBe(false);
  });
});
