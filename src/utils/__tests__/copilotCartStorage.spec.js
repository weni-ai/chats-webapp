import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  MAX_COPILOT_CART_ROOMS,
  buildCopilotCartStorageKey,
  clearRoomCart,
  getRoomCart,
  saveRoomCart,
} from '@/utils/copilotCartStorage';
import { moduleStorage } from '@/utils/storage';

const SCOPE = {
  projectUuid: 'project-1',
  agentEmail: 'agent@example.com',
};
const STORAGE_KEY = buildCopilotCartStorageKey(
  SCOPE.projectUuid,
  SCOPE.agentEmail,
);

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

describe('copilotCartStorage', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {};

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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('stores cart items for a room', () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    saveRoomCart(SCOPE, 'room-1', {
      'sku-1': { ...PRODUCT, quantity: 2 },
    });

    expect(moduleStorage.getItem(STORAGE_KEY)).toEqual({
      'room-1': {
        items: {
          'sku-1': { ...PRODUCT, quantity: 2 },
        },
        updatedAt: now,
      },
    });
    expect(getRoomCart(SCOPE, 'room-1')).toEqual({
      'sku-1': { ...PRODUCT, quantity: 2 },
    });
  });

  it('isolates registries by project and agent', () => {
    saveRoomCart(SCOPE, 'room-1', {
      'sku-1': { ...PRODUCT, quantity: 1 },
    });
    saveRoomCart(
      {
        projectUuid: 'project-2',
        agentEmail: SCOPE.agentEmail,
      },
      'room-1',
      {
        'sku-1': { ...PRODUCT, quantity: 9 },
      },
    );

    expect(getRoomCart(SCOPE, 'room-1')['sku-1'].quantity).toBe(1);
    expect(
      getRoomCart(
        { projectUuid: 'project-2', agentEmail: SCOPE.agentEmail },
        'room-1',
      )['sku-1'].quantity,
    ).toBe(9);
  });

  it('does not read or write without a complete scope', () => {
    saveRoomCart({ projectUuid: SCOPE.projectUuid }, 'room-1', {
      'sku-1': { ...PRODUCT, quantity: 1 },
    });

    expect(getRoomCart(SCOPE, 'room-1')).toEqual({});
    expect(getRoomCart({ projectUuid: SCOPE.projectUuid }, 'room-1')).toEqual(
      {},
    );
    expect(moduleStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('treats corrupt storage as empty and ignores invalid items', () => {
    moduleStorage.setItem(STORAGE_KEY, 'not-an-object');
    expect(getRoomCart(SCOPE, 'room-1')).toEqual({});

    moduleStorage.setItem(STORAGE_KEY, { 'room-1': { bad: true } });
    expect(getRoomCart(SCOPE, 'room-1')).toEqual({});

    moduleStorage.setItem(STORAGE_KEY, {
      'room-1': {
        items: {
          'sku-1': { ...PRODUCT, quantity: 0 },
          'sku-2': { name: 'Broken' },
          'sku-3': { ...PRODUCT, product_retailer_id: 'sku-3', quantity: 4 },
        },
        updatedAt: 1,
      },
    });
    expect(getRoomCart(SCOPE, 'room-1')).toEqual({
      'sku-3': { ...PRODUCT, product_retailer_id: 'sku-3', quantity: 4 },
    });
  });

  it('removes the room entry when the cart is empty', () => {
    saveRoomCart(SCOPE, 'room-1', {
      'sku-1': { ...PRODUCT, quantity: 1 },
    });
    saveRoomCart(SCOPE, 'room-2', {
      'sku-1': { ...PRODUCT, quantity: 2 },
    });

    saveRoomCart(SCOPE, 'room-1', {});

    expect(getRoomCart(SCOPE, 'room-1')).toEqual({});
    expect(getRoomCart(SCOPE, 'room-2')['sku-1'].quantity).toBe(2);
    expect(moduleStorage.getItem(STORAGE_KEY)['room-1']).toBeUndefined();
  });

  it('clears a room cart without touching other rooms', () => {
    saveRoomCart(SCOPE, 'room-1', {
      'sku-1': { ...PRODUCT, quantity: 1 },
    });
    saveRoomCart(SCOPE, 'room-2', {
      'sku-1': { ...PRODUCT, quantity: 2 },
    });

    clearRoomCart(SCOPE, 'room-1');

    expect(getRoomCart(SCOPE, 'room-1')).toEqual({});
    expect(getRoomCart(SCOPE, 'room-2')['sku-1'].quantity).toBe(2);
  });

  it('keeps at most 200 rooms and discards the oldest updated first', () => {
    vi.spyOn(Date, 'now').mockImplementation(() => 0);

    for (let index = 0; index < MAX_COPILOT_CART_ROOMS; index += 1) {
      Date.now.mockReturnValue(index);
      saveRoomCart(SCOPE, `room-${index}`, {
        'sku-1': { ...PRODUCT, quantity: 1 },
      });
    }

    Date.now.mockReturnValue(MAX_COPILOT_CART_ROOMS);
    saveRoomCart(SCOPE, 'room-new', {
      'sku-1': { ...PRODUCT, quantity: 1 },
    });

    expect(getRoomCart(SCOPE, 'room-0')).toEqual({});
    expect(getRoomCart(SCOPE, 'room-new')['sku-1'].quantity).toBe(1);
    expect(Object.keys(moduleStorage.getItem(STORAGE_KEY))).toHaveLength(
      MAX_COPILOT_CART_ROOMS,
    );
  });
});
