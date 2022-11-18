import Vue from 'vue';
import VueI18n from 'vue-i18n';

// eslint-disable-next-line camelcase
import pt_br from '@/locales/pt_br.json';
import en_us from '@/locales/en_us.json';
import es from '@/locales/es.json';

const moment = require('moment');

moment.locale('pt-br');

require('moment/locale/pt-br');
require('moment/locale/es');

Vue.use(VueI18n);

const messages = {
  'pt-br': pt_br,
  'en-us': en_us,
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
    'en-us': {
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
