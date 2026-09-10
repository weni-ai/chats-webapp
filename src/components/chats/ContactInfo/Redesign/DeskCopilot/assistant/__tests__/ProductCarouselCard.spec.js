import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductCarouselCard from '../ProductCarouselCard.vue';

const product = {
  product_retailer_id: 'sku-1',
  name: 'Tile',
  price: 32,
  sale_price: 27,
  currency: 'BRL',
  image: 'https://example.com/tile.png',
};

const createWrapper = (props = {}) =>
  mount(ProductCarouselCard, {
    props: {
      product,
      quantity: 0,
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicButton: {
          name: 'UnnnicButton',
          template: '<button v-bind="$attrs" @click="$emit(\'click\')" />',
          inheritAttrs: false,
        },
        UnnnicIcon: true,
        UnnnicToolTip: {
          name: 'UnnnicToolTip',
          template: '<div><slot /></div>',
        },
        ProductQuantityControls: {
          name: 'ProductQuantityControls',
          template: '<div data-testid="product-quantity-controls" />',
        },
      },
    },
  });

describe('ProductCarouselCard', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('shows add and remove actions by default', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="product-carousel-card-add"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="product-carousel-card-remove"]').exists(),
    ).toBe(true);
  });

  it('hides cart actions when readOnly', () => {
    wrapper = createWrapper({ readOnly: true });

    expect(
      wrapper.find('[data-testid="product-carousel-card-add"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="product-carousel-card-remove"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="product-quantity-controls"]').exists(),
    ).toBe(false);
  });

  it('hides quantity controls when readOnly even if quantity is set', () => {
    wrapper = createWrapper({ readOnly: true, quantity: 2 });

    expect(
      wrapper.find('[data-testid="product-quantity-controls"]').exists(),
    ).toBe(false);
  });
});
