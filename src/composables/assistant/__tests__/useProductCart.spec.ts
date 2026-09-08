import { describe, it, expect } from 'vitest';
import { useProductCart } from '../useProductCart';

const PRODUCT = {
  product_retailer_id: 'sku-1',
  name: 'Tile',
  price: 32,
  sale_price: 27,
  currency: 'BRL',
  image: 'https://example.com/tile.png',
  description: 'Gray tile',
  seller_id: '1',
};

describe('useProductCart', () => {
  it('adds, increments, decrements and removes items', () => {
    const cart = useProductCart();

    cart.addItem(PRODUCT);
    expect(cart.getQuantity('sku-1')).toBe(1);
    expect(cart.totalQuantity.value).toBe(1);

    cart.incrementQuantity(PRODUCT);
    expect(cart.getQuantity('sku-1')).toBe(2);

    cart.decrementQuantity(PRODUCT);
    expect(cart.getQuantity('sku-1')).toBe(1);

    cart.decrementQuantity(PRODUCT);
    expect(cart.getQuantity('sku-1')).toBe(0);
    expect(cart.items.value).toHaveLength(0);
  });

  it('computes subtotal, discount and total', () => {
    const cart = useProductCart();
    cart.setQuantity(PRODUCT, 10);

    expect(cart.subtotal.value).toBe(320);
    expect(cart.discount.value).toBe(50);
    expect(cart.total.value).toBe(270);
  });

  it('ignores invalid sale prices that are higher than price', () => {
    const cart = useProductCart();
    cart.setQuantity(
      {
        ...PRODUCT,
        price: 27,
        sale_price: 32,
      },
      2,
    );

    expect(cart.discount.value).toBe(0);
    expect(cart.total.value).toBe(54);
  });

  it('builds order product items for sendOrder', () => {
    const cart = useProductCart();
    cart.setQuantity(PRODUCT, 2);

    expect(cart.toOrderProductItems()).toEqual([
      {
        product_retailer_id: 'sku-1',
        name: 'Tile',
        price: 32,
        sale_price: 27,
        currency: 'BRL',
        image: 'https://example.com/tile.png',
        description: 'Gray tile',
        seller_id: '1',
        quantity: 2,
      },
    ]);
  });

  it('clears the cart', () => {
    const cart = useProductCart();
    cart.addItem(PRODUCT);
    cart.clear();

    expect(cart.items.value).toHaveLength(0);
    expect(cart.totalQuantity.value).toBe(0);
  });
});
