import Vue from 'vue';
import VueI18n from 'vue-i18n';

// eslint-disable-next-line camelcase
import pt_br from '@/locales/pt_br.json';
import en_us from '@/locales/en_us.json';

Vue.use(VueI18n);

const messages = {
  'pt-br': pt_br,
  'en-us': en_us,
};

const i18n = new VueI18n({
  locale: 'pt-BR',
  fallbackLocale: 'pt-BR',
  messages,
  dateTimeFormats: {
    'pt-BR': {
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
  },
});

export default i18n;
