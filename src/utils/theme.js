/**
 * Broadcasts the current theme to the parent frame so cross-origin hosts
 * (Connect) can react. Follows the existing postMessage pattern used across
 * the app (e.g. `chats:update-unread-messages`, `getLanguage`, `redirect`).
 *
 * The contract is one-way (chats → host) and must be re-emitted on every
 * iframe (re)mount — Connect doesn't have access to the chats `localStorage`
 * because of the cross-origin boundary, so this is the only reliable signal.
 */

export const THEME_PARENT_EVENT = 'chats:theme';

export function notifyParentOfTheme(theme) {
  if (typeof theme !== 'string') return;
  if (typeof globalThis === 'undefined' || !globalThis.window?.parent) return;
  globalThis.window.parent.postMessage(
    { event: THEME_PARENT_EVENT, theme },
    '*',
  );
}
