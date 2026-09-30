/**
 * Channel name for federated-mode host messages. Connect listens for this
 * CustomEvent on `window` and routes the payload to the same handlers that
 * previously accepted iframe postMessages.
 */
export const HOST_BRIDGE_EVENT = 'chatsToHost';

export type HostBridgePayload = Record<string, unknown>;

/**
 * Send an event to the connect host via a `chatsToHost` CustomEvent on `window`.
 * Used both when federated (same document as Connect) and in unit tests /
 * standalone — there is no longer an iframe parent contract.
 */
export function emitToHost(event: string, data: HostBridgePayload = {}): void {
  if (typeof window === 'undefined') return;

  const payload = { event, ...data };

  window.dispatchEvent(new CustomEvent(HOST_BRIDGE_EVENT, { detail: payload }));
}
