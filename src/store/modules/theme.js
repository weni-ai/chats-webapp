import { defineStore } from 'pinia';

import {
  THEMES,
  applyEffectiveTheme,
  getStoredTheme,
  isValidTheme,
  notifyParentOfTheme,
  persistTheme,
} from '@/utils/theme';

export const useTheme = defineStore('theme', {
  state: () => ({
    theme: getStoredTheme(),
  }),

  getters: {
    isDark: (state) => state.theme === THEMES.DARK,
  },

  actions: {
    setTheme(theme) {
      if (!isValidTheme(theme) || this.theme === theme) return;
      this.theme = theme;
      persistTheme(theme);
      // Use `applyEffectiveTheme` so toggles made elsewhere don't accidentally
      // re-enable dark on light-only routes (e.g. `/settings`). The persisted
      // preference is still updated above — only the visual layer is gated.
      applyEffectiveTheme(theme);
      // Broadcast every user-driven theme change up to the embedding host.
      // The initial mount is announced separately from `App.vue`, so this
      // call covers all subsequent toggles. We always emit the persisted
      // preference (not the route-effective one) so Connect mirrors the
      // user's actual choice regardless of which chats page is open.
      notifyParentOfTheme(theme);
    },

    toggleTheme() {
      this.setTheme(this.isDark ? THEMES.LIGHT : THEMES.DARK);
    },
  },
});
