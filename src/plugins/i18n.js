import { createI18n } from 'vue-i18n';

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

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages,
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
});

export default i18n;
