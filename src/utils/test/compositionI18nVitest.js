import { config } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterAll, beforeAll } from 'vitest';

import UnnnicSystemPlugin from '@/plugins/UnnnicSystem.js';

// eslint-disable-next-line camelcase
import pt_br from '@/locales/pt_br.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

/**
 * Legacy vue-i18n mixins break `<script setup>` in VTU (they assign `this.$t` in beforeCreate).
 * Call `useCompositionI18nInThisSpecFile()` once inside the top-level `describe` for specs that
 * mount those trees.
 *
 * Alternative for a single leaf component: filter `i18n` out of `config.global.plugins` in
 * `beforeAll` / restore in `afterAll`, and pass `mocks: { $t: ... }` on `mount` — see
 * `ModalOfflineAgent.spec.js`.
 */
const compositionI18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  globalInjection: true,
  messages: {
    'pt-br': pt_br,
    en,
    es,
  },
});

let savedPlugins;

export function useCompositionI18nInThisSpecFile() {
  beforeAll(() => {
    savedPlugins = [...config.global.plugins];
    config.global.plugins = [compositionI18n, UnnnicSystemPlugin];
  });
  afterAll(() => {
    config.global.plugins = savedPlugins;
  });
}
