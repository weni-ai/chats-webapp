import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

import { moduleStorage } from '@/utils/storage';
import { THEMES } from '@/utils/theme';

describe('useTheme Store', () => {
  let useTheme;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    moduleStorage.clear();
    document.documentElement.classList.remove('dark');

    vi.resetModules();
    ({ useTheme } = await import('../theme'));
  });

  afterEach(() => {
    moduleStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('initializes with light theme by default and html.dark is absent', () => {
    const themeStore = useTheme();

    expect(themeStore.theme).toBe(THEMES.LIGHT);
    expect(themeStore.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('hydrates from moduleStorage when a valid value is stored', async () => {
    moduleStorage.setItem('theme', THEMES.DARK);

    vi.resetModules();
    const { useTheme: useThemeReloaded } = await import('../theme');
    const themeStore = useThemeReloaded();

    expect(themeStore.theme).toBe(THEMES.DARK);
    expect(themeStore.isDark).toBe(true);
  });

  it('falls back to light when moduleStorage holds an invalid value', async () => {
    moduleStorage.setItem('theme', 'invalid');

    vi.resetModules();
    const { useTheme: useThemeReloaded } = await import('../theme');
    const themeStore = useThemeReloaded();

    expect(themeStore.theme).toBe(THEMES.LIGHT);
  });

  it('setTheme updates state, persists and toggles html.dark', () => {
    const themeStore = useTheme();

    themeStore.setTheme(THEMES.DARK);

    expect(themeStore.theme).toBe(THEMES.DARK);
    expect(themeStore.isDark).toBe(true);
    expect(moduleStorage.getItem('theme')).toBe(THEMES.DARK);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    themeStore.setTheme(THEMES.LIGHT);

    expect(themeStore.theme).toBe(THEMES.LIGHT);
    expect(themeStore.isDark).toBe(false);
    expect(moduleStorage.getItem('theme')).toBe(THEMES.LIGHT);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setTheme is a no-op when called with an invalid value', () => {
    const themeStore = useTheme();

    themeStore.setTheme('purple');

    expect(themeStore.theme).toBe(THEMES.LIGHT);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setTheme is a no-op when called with the current value', () => {
    const themeStore = useTheme();
    const setItemSpy = vi.spyOn(moduleStorage, 'setItem');

    themeStore.setTheme(THEMES.LIGHT);

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('toggleTheme flips between light and dark', () => {
    const themeStore = useTheme();

    themeStore.toggleTheme();
    expect(themeStore.theme).toBe(THEMES.DARK);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    themeStore.toggleTheme();
    expect(themeStore.theme).toBe(THEMES.LIGHT);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
