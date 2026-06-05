import { isFederatedModule } from '@/utils/moduleFederation';
import { emitToHost } from '@/utils/hostBridge';

/**
 * Keep the connect host in sync with the chats internal router on every
 * navigation.
 *
 * - Federated mode: do nothing here. The host attaches its own `afterEach` to
 *   the chats router (via `useFederatedModule`'s `setupRouterSync`) and is the
 *   one that dispatches the `updateRoute` CustomEvent. Emitting it here too
 *   would duplicate every event and fight the host router. Mirrors the
 *   insights-webapp router, whose `afterEach` is a no-op when federated.
 * - Standalone / iframe: emit the legacy `changePathname` postMessage so the
 *   host's `ExternalSystem` iframe handler keeps working.
 */
const sendMessageWhenRouteChanges = async (to) => {
  if (isFederatedModule) return;

  emitToHost('changePathname', {
    pathname: window.location.pathname,
    query: to.query || {},
  });
};

export default [sendMessageWhenRouteChanges];
