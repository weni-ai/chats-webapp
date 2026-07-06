import { createI18n } from 'vue-i18n';

// eslint-disable-next-line camelcase
import pt_br from '@/locales/pt_br.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import ro from '@/locales/ro.json';

import { icuMessageCompiler } from '@/utils/i18n/icuMessageCompiler';

import('moment/dist/locale/es.js');
import('moment/dist/locale/pt-br.js');
import('moment/dist/locale/ro.js');

const messages = {
  'pt-br': pt_br,
  en,
  es,
  ro,
};

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  warnHtmlInMessage: 'off',
  messages,
  messageCompiler: icuMessageCompiler,
  globalInjection: true, // Enable $t in templates
  dateTimeFormats: {
    'pt-br': {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
      long: {
        month: 'long',
        day: '2-digit',
      },
    },
    en: {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
      long: {
        month: 'long',
        day: '2-digit',
      },
    },
    es: {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
      long: {
        month: 'long',
        day: '2-digit',
      },
    },
    ro: {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
      long: {
        month: 'long',
        day: '2-digit',
      },
    },
  },
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  missingWarn: false,
  fallbackWarn: false,
});

export default i18n;
