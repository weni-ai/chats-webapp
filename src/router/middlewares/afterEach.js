/**
 * Host route sync middleware.
 *
 * Federated: the host attaches its own `afterEach` to the chats router (via
 * `useChatsFederatedModule`'s `setupRouterSync`) and dispatches `updateRoute`.
 * Emitting from here would duplicate every event. Standalone has no Connect
 * parent to sync with. This middleware is intentionally a no-op.
 */
export default [];
