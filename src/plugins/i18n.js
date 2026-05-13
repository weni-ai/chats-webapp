import { createI18n } from 'vue-i18n';

import IntlMessageFormat from 'intl-messageformat';
// eslint-disable-next-line camelcase
import pt_br from '@/locales/pt_br.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

import('moment/dist/locale/es.js');
import('moment/dist/locale/pt-br.js');

const messages = {
  'pt-br': pt_br,
  en,
  es,
};

/**
 * ICU plural/select blocks must use IntlMessageFormat. Everything else keeps
 * Vue I18n syntax (@: links, modifiers, etc.).
 */
const messageCompiler = (message, { locale, key, onError }) => {
  if (typeof message === 'string') {
    const formatter = new IntlMessageFormat(message, locale);
    return (ctx) => {
      return formatter.format(ctx.values);
    };
  } else {
    onError && onError(new Error('not support for AST'));
    return () => key;
  }
};

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
  messageCompiler,
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
  },
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  missingWarn: false,
  fallbackWarn: false,
});

export default i18n;
