import { emitToHost } from './hostBridge';

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
  // `.chats-webapp .dark` / `.chats-webapp.dark` — actually match.
  //
  // Deliberately NOT falling back to `document.querySelector('.chats-webapp')`
  // when `mountContainer` is missing: federation can keep two DOM nodes with
  // that class alive at once (live desk `#chats-app` + settings
  // `#chats-settings-app`, the latter only removed when Settings' own
  // `<RouterView>` unmounts). Guessing via `querySelector` would silently pick
  // whichever one is first in the DOM — possibly the wrong, forced-light one —
  // and leave the live desk container's own `.dark` class stale. Every caller
  // in this codebase always resolves `mountContainer` explicitly
  // (`chatsThemeMountContainer`, provided per-mount in `main.js`); if that ever
  // comes back empty, no-op loudly instead of guessing wrong silently.
  if (!mountContainer) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[chats] applyRouteAwareTheme called without a mount container — skipping to avoid theming the wrong `.chats-webapp` instance.',
      );
    }
    return;
  }
  mountContainer.classList.toggle(DARK_CLASS, wantsDark);

  // Live desk owns the document-global `.dark` that unprefixed unnnic base CSS
  // (e.g. UnnnicSkeletonLoading in Desk Copilot) depends on. Re-assert it
  // whenever this surface wants dark so a leftover settings MutationObserver
  // or useTheme watcher cannot leave `<html>` stuck light after navigating
  // settings → channels → live desk.
  if (wantsDark) {
    document.documentElement.classList.add(DARK_CLASS);
  }
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
 * Mirror of light-theme enforcement for the live desk. After settings →
 * channels → live desk the container paints correctly for one frame (eager
 * `.dark` apply) and then a leftover `useTheme()` watcher or host toggle
 * strips `.dark` from `<html>` and/or the mount container. Unprefixed unnnic
 * tokens on the host stay dark (sidebar inspect) while chats-prefixed
 * selectors that need `.chats-webapp.dark` lose the class — dark bubbles,
 * light text. While live desk wants dark, re-assert both classes.
 */
let darkThemeEnforcementCount = 0;
let darkKeepObserver = null;
let darkKeepContainer = null;

function assertDarkClasses() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add(DARK_CLASS);
  darkKeepContainer?.classList.add(DARK_CLASS);
}

export function startDarkThemeEnforcement(mountContainer) {
  if (typeof document === 'undefined') return;

  darkKeepContainer = mountContainer || darkKeepContainer;
  darkThemeEnforcementCount += 1;
  if (darkThemeEnforcementCount > 1) {
    assertDarkClasses();
    return;
  }

  assertDarkClasses();

  if (typeof MutationObserver === 'undefined') return;

  darkKeepObserver = new MutationObserver(() => {
    const htmlMissingDark =
      !document.documentElement.classList.contains(DARK_CLASS);
    const containerMissingDark =
      !!darkKeepContainer && !darkKeepContainer.classList.contains(DARK_CLASS);
    if (htmlMissingDark || containerMissingDark) {
      assertDarkClasses();
    }
  });

  darkKeepObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  if (darkKeepContainer) {
    darkKeepObserver.observe(darkKeepContainer, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
}

export function stopDarkThemeEnforcement() {
  if (darkThemeEnforcementCount === 0) return;

  darkThemeEnforcementCount -= 1;
  if (darkThemeEnforcementCount > 0) return;

  if (darkKeepObserver) {
    darkKeepObserver.disconnect();
    darkKeepObserver = null;
  }
  darkKeepContainer = null;
}

/**
 * Broadcasts the current theme to the Connect host so it can react (e.g. dark
 * class on the document shell). Uses the same `chatsToHost` CustomEvent
 * contract as redirects and unread counts.
 *
 * Must be re-emitted on every mount — Connect does not read chats localStorage.
 */
export function notifyParentOfTheme(theme) {
  if (typeof theme !== 'string') return;

  emitToHost(THEME_PARENT_EVENT, { theme });
}
