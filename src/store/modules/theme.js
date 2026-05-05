import { defineStore } from 'pinia';

import {
  THEMES,
  applyTheme,
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
      applyTheme(theme);
      // Broadcast every user-driven theme change up to the embedding host.
      // The initial mount is announced separately from `App.vue`, so this
      // call covers all subsequent toggles.
      notifyParentOfTheme(theme);
    },

    toggleTheme() {
      this.setTheme(this.isDark ? THEMES.LIGHT : THEMES.DARK);
    },
  },
});
