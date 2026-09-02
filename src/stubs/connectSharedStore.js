/**
 * Standalone dev stub for `connect/sharedStore`.
 *
 * When `MODULE_FEDERATION_CONNECT_URL` is not configured (running chats
 * directly via `npm run dev` outside of the connect host) the rspack alias
 * resolves `connect/sharedStore` imports to this file so the bundle still
 * builds. The stub returns `null` so downstream code uses local storage /
 * config for token and project instead of the host shared store.
 */
export const useSharedStore = () => null;
