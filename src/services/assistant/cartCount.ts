type CartUpdatedPayload = {
  count?: number;
  data?: {
    count?: number;
    items?: unknown[];
  };
  items?: unknown[];
};

export function extractCartCount(payload: unknown): number {
  if (payload == null) {
    return 0;
  }

  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return Math.max(0, Math.floor(payload));
  }

  if (typeof payload !== 'object') {
    return 0;
  }

  const cart = payload as CartUpdatedPayload;

  if (typeof cart.count === 'number' && Number.isFinite(cart.count)) {
    return Math.max(0, Math.floor(cart.count));
  }

  if (Array.isArray(cart.items)) {
    return cart.items.length;
  }

  if (
    typeof cart.data?.count === 'number' &&
    Number.isFinite(cart.data.count)
  ) {
    return Math.max(0, Math.floor(cart.data.count));
  }

  if (Array.isArray(cart.data?.items)) {
    return cart.data.items.length;
  }

  return 0;
}
