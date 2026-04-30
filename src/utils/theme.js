import { moduleStorage } from '@/utils/storage';

export const THEME_STORAGE_KEY = 'theme';

export const THEMES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
});

const DARK_CLASS = 'dark';

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

export function initTheme() {
  applyTheme(getStoredTheme());
}
