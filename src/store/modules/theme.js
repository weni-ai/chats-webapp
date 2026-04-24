import { defineStore } from 'pinia';

import {
  THEMES,
  applyTheme,
  getStoredTheme,
  isValidTheme,
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
    },

    toggleTheme() {
      this.setTheme(this.isDark ? THEMES.LIGHT : THEMES.DARK);
    },
  },
});
