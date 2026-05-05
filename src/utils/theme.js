import { moduleStorage } from '@/utils/storage';

export const THEME_STORAGE_KEY = 'theme';

export const THEMES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
});

const DARK_CLASS = 'dark';

// Event name used to broadcast theme changes to the embedding webapp
// (Connect). Matches the contract agreed with the host: the chats iframe is
// always the source of truth for the theme, Connect is just a consumer.
export const THEME_PARENT_EVENT = 'chats:theme';

export function isValidTheme(value) {
  return value === THEMES.LIGHT || value === THEMES.DARK;
}

export function getStoredTheme() {
  const stored = moduleStorage.getItem(THEME_STORAGE_KEY, THEMES.LIGHT);
  return isValidTheme(stored) ? stored : THEMES.LIGHT;
}

export function persistTheme(theme) {
  if (!isValidTheme(theme)) return;
  moduleStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyTheme(theme) {
  const root =
    typeof document !== 'undefined' ? document.documentElement : null;
  if (!root) return;
  root.classList.toggle(DARK_CLASS, theme === THEMES.DARK);
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
  if (!isValidTheme(theme)) return;
  if (typeof globalThis === 'undefined' || !globalThis.window?.parent) return;
  const payload = { event: THEME_PARENT_EVENT, theme };
  globalThis.window.parent.postMessage(payload, '*');
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
