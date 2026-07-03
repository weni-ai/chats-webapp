export const THEME_PARENT_EVENT = 'chats:theme';

const DARK_CLASS = 'dark';

const LIGHT_ONLY_ROUTE_PREFIXES = ['/settings'];

export function isLightOnlyRoute(path) {
  if (typeof path !== 'string') return false;
  return LIGHT_ONLY_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function applyRouteAwareTheme(
  theme,
  routePath,
  mountContainer,
  forceLight = false,
) {
  if (typeof document === 'undefined') return;
  const wantsDark =
    theme === 'dark' && !forceLight && !isLightOnlyRoute(routePath);
  // Toggle on this instance's `.chats-webapp` mount container (not `<html>`)
  // so the unnnic dark-mode overrides — which postcss-prefixwrap rewrites as
  // `.chats-webapp .dark` / `.chats-webapp.dark` — actually match. In
  // federation the host may keep two mounts alive (live desk + settings);
  // `querySelector` would always hit the first one and leak theme state.
  const target =
    mountContainer ??
    document.querySelector('.chats-webapp') ??
    document.documentElement;
  target.classList.toggle(DARK_CLASS, wantsDark);
}

/**
 * `useTheme()` from unnnic toggles `.dark` on `document.documentElement`
 * globally, and every `useTheme()` call registers its own watcher. Based
 * mounts (settings) must stay light while active even when the live-desk
 * mount reapplies `.dark` from its preference. A single clear is racy, so
 * we install a MutationObserver that strips `.dark` from `<html>` as soon
 * as anyone re-adds it.
 *
 * Refcounted so nested/overlapping enforcement (should not happen in
 * practice, but safe) reuses the same observer.
 */
let lightThemeEnforcementCount = 0;
let darkGuardObserver = null;

function stripHtmlDark() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove(DARK_CLASS);
}

export function startLightThemeEnforcement() {
  if (typeof document === 'undefined') return;

  lightThemeEnforcementCount += 1;
  if (lightThemeEnforcementCount > 1) return;

  stripHtmlDark();

  if (typeof MutationObserver === 'undefined') return;

  darkGuardObserver = new MutationObserver(() => {
    if (document.documentElement.classList.contains(DARK_CLASS)) {
      stripHtmlDark();
    }
  });

  darkGuardObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

export function stopLightThemeEnforcement() {
  if (lightThemeEnforcementCount === 0) return;

  lightThemeEnforcementCount -= 1;
  if (lightThemeEnforcementCount > 0) return;

  if (darkGuardObserver) {
    darkGuardObserver.disconnect();
    darkGuardObserver = null;
  }
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
