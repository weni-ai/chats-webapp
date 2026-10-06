import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { useProductCart } from '../useProductCart';
import {
  buildCopilotCartStorageKey,
  saveRoomCart,
} from '@/utils/copilotCartStorage';
import { moduleStorage } from '@/utils/storage';

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

const SCOPE = {
  projectUuid: 'project-1',
  agentEmail: 'agent@example.com',
};

function stubLocalStorage() {
  const mockLocalStorage = {};

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => mockLocalStorage[key] ?? null),
    setItem: vi.fn((key, value) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete mockLocalStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockLocalStorage).forEach(
        (key) => delete mockLocalStorage[key],
      );
    }),
    key: vi.fn((index) => Object.keys(mockLocalStorage)[index] ?? null),
    get length() {
      return Object.keys(mockLocalStorage).length;
    },
  });
}

function runWithScope(factory) {
  const scope = effectScope();
  const api = scope.run(factory);
  return { api, stop: () => scope.stop() };
}

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

  describe('per-room persistence', () => {
    beforeEach(() => {
      stubLocalStorage();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('hydrates the cart from storage for the current room', () => {
      saveRoomCart(SCOPE, 'room-1', {
        'sku-1': { ...PRODUCT, quantity: 2 },
      });

      const roomUuid = ref('room-1');
      const storageScope = ref(SCOPE);
      const { api, stop } = runWithScope(() =>
        useProductCart({ roomUuid, storageScope }),
      );

      expect(api.getQuantity('sku-1')).toBe(2);
      expect(api.totalQuantity.value).toBe(2);
      stop();
    });

    it('saves when items are edited', () => {
      const roomUuid = ref('room-1');
      const storageScope = ref(SCOPE);
      const { api, stop } = runWithScope(() =>
        useProductCart({ roomUuid, storageScope }),
      );

      api.setQuantity(PRODUCT, 3);

      expect(
        moduleStorage.getItem(
          buildCopilotCartStorageKey(SCOPE.projectUuid, SCOPE.agentEmail),
        )['room-1'].items['sku-1'].quantity,
      ).toBe(3);
      stop();
    });

    it('swaps the cart when switching rooms', () => {
      saveRoomCart(SCOPE, 'room-1', {
        'sku-1': { ...PRODUCT, quantity: 2 },
      });
      saveRoomCart(SCOPE, 'room-2', {
        'sku-1': { ...PRODUCT, quantity: 5 },
      });

      const roomUuid = ref('room-1');
      const storageScope = ref(SCOPE);
      const { api, stop } = runWithScope(() =>
        useProductCart({ roomUuid, storageScope }),
      );

      expect(api.getQuantity('sku-1')).toBe(2);

      roomUuid.value = 'room-2';
      expect(api.getQuantity('sku-1')).toBe(5);

      api.setQuantity(PRODUCT, 1);
      roomUuid.value = 'room-1';
      expect(api.getQuantity('sku-1')).toBe(2);
      stop();
    });

    it('works without a scope', () => {
      const cart = useProductCart();
      cart.addItem(PRODUCT);

      expect(cart.getQuantity('sku-1')).toBe(1);
      expect(
        moduleStorage.getItem(
          buildCopilotCartStorageKey(SCOPE.projectUuid, SCOPE.agentEmail),
        ),
      ).toBeNull();
    });
  });
});
