import Vue from 'vue';
import VueI18n from 'vue-i18n';

// eslint-disable-next-line camelcase
import pt_br from '@/locales/pt_br.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

import moment from 'moment';

import('moment/locale/pt-br');
import('moment/locale/es');

moment.locale('pt-br');

Vue.use(VueI18n);

const messages = {
  'pt-br': pt_br,
  en,
  es,
};

const i18n = new VueI18n({
  locale: 'pt-br',
  fallbackLocale: 'pt-br',
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
