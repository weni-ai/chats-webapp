import Vue from 'vue';
import VueI18n from 'vue-i18n';

// eslint-disable-next-line camelcase
import pt_BR from '@/locales/pt_BR.json';
import en from '@/locales/en.json';

Vue.use(VueI18n);

const messages = {
  'pt-BR': pt_BR,
  en,
};

const i18n = new VueI18n({
  locale: 'pt-BR',
  fallbackLocale: 'pt-BR',
  messages,
});

export default i18n;
