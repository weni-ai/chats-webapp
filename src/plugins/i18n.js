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

/** ICU plural / select / selectordinal blocks. */
const ICU_MESSAGE_PATTERN = /\{[^{}]+,\s*(plural|select|selectordinal)\s*[,}]/;

/** HTML-like markup breaks IntlMessageFormat (e.g. <i> is read as variable "i"). */
const HTML_MARKUP_PATTERN = /<\/?[a-zA-Z][^>]*>/;

function formatNamedPlaceholders(message, values) {
  if (!values || typeof values !== 'object') {
    return message;
  }

  return message.replace(/\{(\w+)\}/g, (match, name) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) {
      return match;
    }
    const value = values[name];
    return value == null ? '' : String(value);
  });
}

function shouldUseIntlMessageFormat(message) {
  return (
    ICU_MESSAGE_PATTERN.test(message) && !HTML_MARKUP_PATTERN.test(message)
  );
}

/**
 * ICU plural/select uses IntlMessageFormat. Plain strings (HTML, <br>, simple
 * {name} placeholders) use named interpolation only.
 */
const messageCompiler = (message, { locale, key, onError }) => {
  if (typeof message === 'string') {
    if (shouldUseIntlMessageFormat(message)) {
      const formatter = new IntlMessageFormat(message, locale);
      return (ctx) => formatter.format(ctx.values);
    }

    return (ctx) => formatNamedPlaceholders(message, ctx.values);
  }

  onError && onError(new Error('not support for AST'));
  return () => key;
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
