import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

import type {
  CartProductItem,
  OrderProductItem,
  ProductCarouselItem,
} from '@/services/assistant/types';
import { parseProductPrice } from '@/services/assistant/currency';
import { getRoomCart, saveRoomCart } from '@/utils/copilotCartStorage';

export type CopilotCartStorageScope = {
  projectUuid?: string;
  agentEmail?: string;
};

export type UseProductCartOptions = {
  roomUuid?: MaybeRefOrGetter<string | undefined>;
  storageScope?: MaybeRefOrGetter<CopilotCartStorageScope>;
};

export function useProductCart(options: UseProductCartOptions = {}) {
  const cart = ref<Record<string, CartProductItem>>({});
  let isHydrating = false;

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
      if (!salePrice || salePrice >= price) {
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

  function currentRoomUuid() {
    return toValue(options.roomUuid);
  }

  function currentStorageScope() {
    return toValue(options.storageScope);
  }

  function hydrateFromStorage() {
    const roomUuid = currentRoomUuid();
    const scope = currentStorageScope();

    isHydrating = true;
    cart.value =
      roomUuid && scope?.projectUuid && scope?.agentEmail
        ? getRoomCart(scope, roomUuid)
        : {};
    isHydrating = false;
  }

  function persistToStorage() {
    if (isHydrating) {
      return;
    }

    const roomUuid = currentRoomUuid();
    const scope = currentStorageScope();
    if (!roomUuid || !scope) {
      return;
    }

    saveRoomCart(scope, roomUuid, cart.value);
  }

  if (options.roomUuid || options.storageScope) {
    watch(
      [() => currentRoomUuid(), () => currentStorageScope()],
      hydrateFromStorage,
      { immediate: true, flush: 'sync' },
    );

    watch(cart, persistToStorage, { deep: true, flush: 'sync' });
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
