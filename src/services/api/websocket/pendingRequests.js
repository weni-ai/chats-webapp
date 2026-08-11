import { SocketTimeoutError } from './errors';

const DEFAULT_TIMEOUT_MS = 15000;

/** @type {Map<string, { resolve: Function, reject: Function, timeoutId: ReturnType<typeof setTimeout> }>} */
const pendingRequests = new Map();

export function createPendingRequest(
  requestId,
  { timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new SocketTimeoutError());
    }, timeoutMs);

    pendingRequests.set(requestId, { resolve, reject, timeoutId });
  });
}

function takePendingRequest(requestId) {
  const pending = pendingRequests.get(requestId);

  if (!pending) {
    console.warn(
      `[WebSocket] No pending request found for request_id: ${requestId}`,
    );
    return null;
  }

  clearTimeout(pending.timeoutId);
  pendingRequests.delete(requestId);
  return pending;
}

export function resolvePendingRequest(requestId, payload) {
  const pending = takePendingRequest(requestId);
  if (!pending) return false;

  pending.resolve(payload);
  return true;
}

export function rejectPendingRequest(requestId, error) {
  const pending = takePendingRequest(requestId);
  if (!pending) return false;

  pending.reject(error);
  return true;
}

export function rejectAllPendingRequests(error) {
  const entries = Array.from(pendingRequests.entries());
  pendingRequests.clear();

  entries.forEach(([, { reject, timeoutId }]) => {
    clearTimeout(timeoutId);
    reject(error);
  });
}

export function clearPendingRequests() {
  pendingRequests.forEach(({ timeoutId }) => {
    clearTimeout(timeoutId);
  });
  pendingRequests.clear();
}

export function getPendingRequestsCount() {
  return pendingRequests.size;
}
