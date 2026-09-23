import type { ProductCarouselItem, ProductListSection } from './types';

export type CatalogProductInfo = {
  retailer_id: string;
  name: string;
  price: string;
  sale_price?: string;
  currency?: string;
  image?: string;
  description?: string;
  seller_id?: string;
  product_url?: string;
};

export type CatalogProductGroup = {
  product: string;
  product_retailer_ids: string[];
  product_retailer_info: CatalogProductInfo[];
};

export type CatalogPayload = {
  carousel: true;
  header?: string;
  footer?: string;
  action?: string;
  products: CatalogProductGroup[];
};

export type BuildCatalogPayloadInput = {
  carouselItems?: ProductCarouselItem[];
  productList?: {
    header?: string;
    sections: ProductListSection[];
  };
  dismissedIds?: string[];
};

const DEFAULT_PRODUCT_GROUP = 'product';

function stringifyOptional(
  value: string | number | undefined,
): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return String(value);
}

function mapProductInfo(item: ProductCarouselItem): CatalogProductInfo {
  const info: CatalogProductInfo = {
    retailer_id: item.product_retailer_id,
    name: item.name,
    price: stringifyOptional(item.price) ?? '',
  };

  const salePrice = stringifyOptional(item.sale_price);
  if (salePrice !== undefined) {
    info.sale_price = salePrice;
  }

  if (item.currency) {
    info.currency = item.currency;
  }

  if (item.image) {
    info.image = item.image;
  }

  if (item.description) {
    info.description = item.description;
  }

  if (item.seller_id) {
    info.seller_id = item.seller_id;
  }

  if (item.product_url) {
    info.product_url = item.product_url;
  }

  return info;
}

function mapItemsToGroup(
  product: string,
  items: ProductCarouselItem[],
): CatalogProductGroup | null {
  if (items.length === 0) {
    return null;
  }

  return {
    product: product.trim() || DEFAULT_PRODUCT_GROUP,
    product_retailer_ids: items.map((item) => item.product_retailer_id),
    product_retailer_info: items.map(mapProductInfo),
  };
}

function visibleItems(
  items: ProductCarouselItem[] = [],
  dismissedIds: Set<string>,
): ProductCarouselItem[] {
  return items.filter(
    (item) =>
      item?.product_retailer_id && !dismissedIds.has(item.product_retailer_id),
  );
}

export function buildCatalogPayload({
  carouselItems,
  productList,
  dismissedIds = [],
}: BuildCatalogPayloadInput): CatalogPayload | null {
  const dismissed = new Set(dismissedIds);
  const products: CatalogProductGroup[] = [];

  if (productList?.sections?.length) {
    productList.sections.forEach((section) => {
      const group = mapItemsToGroup(
        section.title,
        visibleItems(section.items, dismissed),
      );

      if (group) {
        products.push(group);
      }
    });
  } else {
    const group = mapItemsToGroup(
      DEFAULT_PRODUCT_GROUP,
      visibleItems(carouselItems, dismissed),
    );

    if (group) {
      products.push(group);
    }
  }

  if (products.length === 0) {
    return null;
  }

  const catalog: CatalogPayload = {
    carousel: true,
    products,
  };

  const header = productList?.header?.trim();
  if (header) {
    catalog.header = header;
  }

  return catalog;
}
