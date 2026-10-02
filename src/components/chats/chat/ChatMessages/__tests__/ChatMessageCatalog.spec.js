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
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicIcon: true,
        UnnnicButton: true,
        UnnnicToolTip: {
          name: 'UnnnicToolTip',
          template: '<div><slot /></div>',
        },
      },
    },
  });

describe('ChatMessageCatalog', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders the header and product names via the Copilot carousel', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="chat-message-catalog-header"]').text(),
    ).toBe('Novidades');
    expect(wrapper.find('[data-testid="product-carousel"]').exists()).toBe(
      true,
    );

    const titles = wrapper.findAll(
      '[data-testid="product-carousel-card-title"]',
    );
    expect(titles).toHaveLength(2);
    expect(titles[0].text()).toBe('Tile');
    expect(titles[1].text()).toBe('Rug');
  });

  it('loads catalog images without sending a referrer', () => {
    wrapper = createWrapper();

    expect(
      wrapper
        .find('[data-testid="product-carousel-card-image"]')
        .attributes('referrerpolicy'),
    ).toBe('no-referrer');
  });

  it('shows a placeholder when the product has no image', () => {
    wrapper = createWrapper();

    const cards = wrapper.findAll('[data-testid="product-carousel-card"]');
    expect(
      cards[1]
        .find('[data-testid="product-carousel-card-image-placeholder"]')
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

  it('does not show cart or dismiss actions in read-only mode', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="product-carousel-card-add"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="product-carousel-card-remove"]').exists(),
    ).toBe(false);
  });
});
