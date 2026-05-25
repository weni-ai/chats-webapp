export const THEME_PARENT_EVENT = 'chats:theme';

const DARK_CLASS = 'dark';

const LIGHT_ONLY_ROUTE_PREFIXES = ['/settings'];

export function isLightOnlyRoute(path) {
  if (typeof path !== 'string') return false;
  return LIGHT_ONLY_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function applyRouteAwareTheme(theme, routePath) {
  if (typeof document === 'undefined') return;
  const wantsDark = theme === 'dark' && !isLightOnlyRoute(routePath);
  // Toggle on the `.chats-webapp` mount container (not `<html>`) so the
  // unnnic dark-mode overrides — which postcss-prefixwrap rewrites as
  // `.chats-webapp .dark` / `.chats-webapp.dark` — actually match. The host
  // owns `<html>` in federation mode, so we shouldn't be touching it
  // either way.
  const target =
    document.querySelector('.chats-webapp') ?? document.documentElement;
  target.classList.toggle(DARK_CLASS, wantsDark);
}

/**
 * Broadcasts the current theme to the parent frame so cross-origin hosts
 * (Connect) can react. Follows the existing postMessage pattern used across
 * the app (e.g. `chats:update-unread-messages`, `getLanguage`, `redirect`).
 *
 * The contract is one-way (chats → host) and must be re-emitted on every
 * iframe (re)mount — Connect doesn't have access to the chats `localStorage`
 * because of the cross-origin boundary, so this is the only reliable signal.
 */
export function notifyParentOfTheme(theme) {
  if (typeof theme !== 'string') return;
  if (typeof globalThis === 'undefined' || !globalThis.window?.parent) return;
  globalThis.window.parent.postMessage(
    { event: THEME_PARENT_EVENT, theme },
    '*',
  );
}
