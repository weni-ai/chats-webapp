import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const messages = {
  'pt-BR': {
    upload_area: {
      title: {
        text: 'Arraste seu arquivo aqui, ou',
        highlight: 'procure-o',
      },

      subtitle: 'Formatos suportados:',
    },
  },
};

const i18n = new VueI18n({
  locale: 'pt-BR',
  fallbackLocale: 'pt-BR',
  messages,
});

export default i18n;
