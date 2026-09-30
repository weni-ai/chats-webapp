import { describe, it, expect } from 'vitest';

import { buildCatalogPayload } from '../buildCatalogPayload';
import type { ProductCarouselItem, ProductListSection } from '../types';

const tile: ProductCarouselItem = {
  product_retailer_id: 'sku-1',
  name: 'Tile',
  price: 32,
  sale_price: 27,
  currency: 'BRL',
  image: 'https://example.com/tile.png',
  description: 'Ceramic tile',
  seller_id: '1',
  product_url: 'https://example.com/tile',
};

const rug: ProductCarouselItem = {
  product_retailer_id: 'sku-2',
  name: 'Rug',
  price: '189.90',
  currency: 'BRL',
  image: 'https://example.com/rug.png',
};

describe('buildCatalogPayload', () => {
  it('maps a simple carousel into a single product group', () => {
    expect(
      buildCatalogPayload({
        carouselItems: [tile, rug],
      }),
    ).toEqual({
      carousel: true,
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
              description: 'Ceramic tile',
              seller_id: '1',
              product_url: 'https://example.com/tile',
            },
            {
              retailer_id: 'sku-2',
              name: 'Rug',
              price: '189.90',
              currency: 'BRL',
              image: 'https://example.com/rug.png',
            },
          ],
        },
      ],
    });
  });

  it('maps each product list section into its own product group', () => {
    const sections: ProductListSection[] = [
      { title: 'TV 32', items: [tile] },
      { title: 'TV 50', items: [rug] },
    ];

    const catalog = buildCatalogPayload({
      productList: {
        header: 'TV selection',
        sections,
      },
    });

    expect(catalog?.header).toBe('TV selection');
    expect(catalog?.products).toHaveLength(2);
    expect(catalog?.products[0].product).toBe('TV 32');
    expect(catalog?.products[1].product).toBe('TV 50');
    expect(catalog?.products[0].product_retailer_ids).toEqual(['sku-1']);
    expect(catalog?.products[1].product_retailer_ids).toEqual(['sku-2']);
  });

  it('excludes dismissed items from the payload', () => {
    const catalog = buildCatalogPayload({
      carouselItems: [tile, rug],
      dismissedIds: ['sku-1'],
    });

    expect(catalog?.products[0].product_retailer_ids).toEqual(['sku-2']);
    expect(catalog?.products[0].product_retailer_info).toHaveLength(1);
  });

  it('omits header when the product list does not provide one', () => {
    const catalog = buildCatalogPayload({
      productList: {
        sections: [{ title: 'TV 32', items: [tile] }],
      },
    });

    expect(catalog).not.toHaveProperty('header');
    expect(catalog).not.toHaveProperty('footer');
    expect(catalog).not.toHaveProperty('action');
  });

  it('omits optional product fields that are missing', () => {
    const catalog = buildCatalogPayload({
      carouselItems: [
        {
          product_retailer_id: 'sku-3',
          name: 'Plain',
          price: '10',
          image: '',
        },
      ],
    });

    expect(catalog?.products[0].product_retailer_info[0]).toEqual({
      retailer_id: 'sku-3',
      name: 'Plain',
      price: '10',
    });
  });

  it('returns null when every item was dismissed', () => {
    expect(
      buildCatalogPayload({
        carouselItems: [tile],
        dismissedIds: ['sku-1'],
      }),
    ).toBeNull();
  });

  it('skips empty product list sections', () => {
    const catalog = buildCatalogPayload({
      productList: {
        sections: [
          { title: 'Empty', items: [] },
          { title: 'TV 32', items: [tile] },
        ],
      },
    });

    expect(catalog?.products).toHaveLength(1);
    expect(catalog?.products[0].product).toBe('TV 32');
  });
});
