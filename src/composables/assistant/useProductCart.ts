import { computed, ref } from 'vue';

import type {
  CartProductItem,
  OrderProductItem,
  ProductCarouselItem,
} from '@/services/assistant/types';
import { parseProductPrice } from '@/services/assistant/currency';

export function useProductCart() {
  const cart = ref<Record<string, CartProductItem>>({});

  const items = computed(() =>
    Object.values(cart.value).filter((item) => item.quantity > 0),
  );

  const totalQuantity = computed(() =>
    items.value.reduce((acc, item) => acc + item.quantity, 0),
  );

  const currency = computed(() => items.value[0]?.currency || 'BRL');

  const subtotal = computed(() =>
    items.value.reduce(
      (acc, item) => acc + parseProductPrice(item.price) * item.quantity,
      0,
    ),
  );

  const discount = computed(() =>
    items.value.reduce((acc, item) => {
      const price = parseProductPrice(item.price);
      const salePrice = parseProductPrice(item.sale_price);
      if (!salePrice || price === salePrice) {
        return acc;
      }
      return acc + (price - salePrice) * item.quantity;
    }, 0),
  );

  const total = computed(() => Math.max(0, subtotal.value - discount.value));

  function getQuantity(productId: string): number {
    return cart.value[productId]?.quantity || 0;
  }

  function setQuantity(product: ProductCarouselItem, quantity: number) {
    const productId = product.product_retailer_id;
    if (!productId) {
      return;
    }

    if (quantity <= 0) {
      const nextCart = { ...cart.value };
      delete nextCart[productId];
      cart.value = nextCart;
      return;
    }

    cart.value = {
      ...cart.value,
      [productId]: {
        ...product,
        quantity,
      },
    };
  }

  function addItem(product: ProductCarouselItem) {
    const current = getQuantity(product.product_retailer_id);
    setQuantity(product, current + 1);
  }

  function incrementQuantity(product: ProductCarouselItem) {
    addItem(product);
  }

  function decrementQuantity(product: ProductCarouselItem) {
    const current = getQuantity(product.product_retailer_id);
    setQuantity(product, current - 1);
  }

  function removeItem(productId: string) {
    if (!cart.value[productId]) {
      return;
    }

    const nextCart = { ...cart.value };
    delete nextCart[productId];
    cart.value = nextCart;
  }

  function clear() {
    cart.value = {};
  }

  function toOrderProductItems(): OrderProductItem[] {
    return items.value.map((item) => ({
      product_retailer_id: item.product_retailer_id,
      name: item.name,
      price: item.price,
      sale_price: item.sale_price,
      currency: item.currency,
      image: item.image,
      description: item.description,
      seller_id: item.seller_id,
      quantity: item.quantity,
    }));
  }

  return {
    cart,
    items,
    totalQuantity,
    currency,
    subtotal,
    discount,
    total,
    getQuantity,
    setQuantity,
    addItem,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clear,
    toOrderProductItems,
  };
}

export type ProductCart = ReturnType<typeof useProductCart>;
