import { isFederatedModule } from './moduleFederation';

/**
 * Channel name for federated-mode host messages. Connect listens for this
 * CustomEvent on `window` and routes the payload to the same handlers that
 * accept iframe postMessages.
 */
export const HOST_BRIDGE_EVENT = 'chatsToHost';

export type HostBridgePayload = Record<string, unknown>;

/**
 * Send an event to the connect host using the right transport for the current
 * runtime:
 * - Federated: dispatch a `chatsToHost` CustomEvent on `window`. The remote
 *   shares the document with the host, so postMessage to `window.parent` is
 *   pointless (it would loop back to ourselves).
 * - Standalone / iframe: keep the legacy `window.parent.postMessage` contract
 *   so the existing host iframe handlers remain in charge.
 */
export function emitToHost(event: string, data: HostBridgePayload = {}): void {
  if (typeof window === 'undefined') return;

  const payload = { event, ...data };

  if (isFederatedModule) {
    window.dispatchEvent(
      new CustomEvent(HOST_BRIDGE_EVENT, { detail: payload }),
    );
    return;
  }

  window.parent?.postMessage(payload, '*');
}
