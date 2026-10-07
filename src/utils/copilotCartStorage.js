import { moduleStorage } from '@/utils/storage';

export const MAX_COPILOT_CART_ROOMS = 200;

export function buildCopilotCartStorageKey(projectUuid, agentEmail) {
  return `copilot_cart_registry:${projectUuid}:${agentEmail}`;
}

function isValidQuantity(quantity) {
  return (
    typeof quantity === 'number' && Number.isFinite(quantity) && quantity > 0
  );
}

function normalizeCartItems(cart) {
  if (!cart || typeof cart !== 'object' || Array.isArray(cart)) {
    return {};
  }

  const items = {};

  Object.entries(cart).forEach(([key, item]) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return;
    }

    const itemProductId =
      typeof item.product_retailer_id === 'string'
        ? item.product_retailer_id
        : '';
    const keyProductId = typeof key === 'string' ? key : '';
    const productId = itemProductId || keyProductId;

    const quantity = Math.floor(item.quantity);
    if (!productId || !isValidQuantity(quantity)) {
      return;
    }

    items[productId] = {
      ...item,
      product_retailer_id: productId,
      quantity,
    };
  });

  return items;
}

function isValidEntry(entry) {
  return (
    !!entry &&
    typeof entry === 'object' &&
    !Array.isArray(entry) &&
    typeof entry.updatedAt === 'number' &&
    Number.isFinite(entry.updatedAt) &&
    !!entry.items &&
    typeof entry.items === 'object' &&
    !Array.isArray(entry.items)
  );
}

function normalizeEntry(entry) {
  return {
    items: normalizeCartItems(entry.items),
    updatedAt: entry.updatedAt,
  };
}

function readMap(projectUuid, agentEmail) {
  if (!projectUuid || !agentEmail) {
    return {};
  }

  const raw = moduleStorage.getItem(
    buildCopilotCartStorageKey(projectUuid, agentEmail),
    null,
  );

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const cleaned = {};
  Object.entries(raw).forEach(([roomUuid, entry]) => {
    if (typeof roomUuid !== 'string' || !roomUuid || !isValidEntry(entry)) {
      return;
    }

    const normalized = normalizeEntry(entry);
    if (Object.keys(normalized.items).length === 0) {
      return;
    }

    cleaned[roomUuid] = normalized;
  });

  return cleaned;
}

function writeMap(projectUuid, agentEmail, map) {
  const key = buildCopilotCartStorageKey(projectUuid, agentEmail);

  if (!map || Object.keys(map).length === 0) {
    moduleStorage.removeItem(key);
    return;
  }

  moduleStorage.setItem(key, map);
}

function pruneLru(map) {
  const entries = Object.entries(map);
  if (entries.length <= MAX_COPILOT_CART_ROOMS) {
    return map;
  }

  entries.sort((left, right) => left[1].updatedAt - right[1].updatedAt);
  return Object.fromEntries(
    entries.slice(entries.length - MAX_COPILOT_CART_ROOMS),
  );
}

export function getRoomCart(scope, roomUuid) {
  const projectUuid = scope?.projectUuid;
  const agentEmail = scope?.agentEmail;

  if (!projectUuid || !agentEmail || !roomUuid) {
    return {};
  }

  const entry = readMap(projectUuid, agentEmail)[roomUuid];
  if (!entry) {
    return {};
  }

  return normalizeCartItems(entry.items);
}

export function saveRoomCart(scope, roomUuid, cart) {
  const projectUuid = scope?.projectUuid;
  const agentEmail = scope?.agentEmail;

  if (!projectUuid || !agentEmail || !roomUuid) {
    return;
  }

  const items = normalizeCartItems(cart);
  if (Object.keys(items).length === 0) {
    clearRoomCart(scope, roomUuid);
    return;
  }

  const map = readMap(projectUuid, agentEmail);
  map[roomUuid] = {
    items,
    updatedAt: Date.now(),
  };
  writeMap(projectUuid, agentEmail, pruneLru(map));
}

export function clearRoomCart(scope, roomUuid) {
  const projectUuid = scope?.projectUuid;
  const agentEmail = scope?.agentEmail;

  if (!projectUuid || !agentEmail || !roomUuid) {
    return;
  }

  const map = readMap(projectUuid, agentEmail);
  if (!map[roomUuid]) {
    return;
  }

  delete map[roomUuid];
  writeMap(projectUuid, agentEmail, map);
}
